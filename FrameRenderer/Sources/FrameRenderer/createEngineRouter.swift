import Vapor 
import Skia
import FrameInterface
import Foundation

fileprivate
typealias GetFrameSchemaClosure = 
  @convention(c) () -> UnsafeMutableRawPointer

fileprivate
var _frameSchemaLibHandle: UnsafeMutableRawPointer? = nil

fileprivate
var _frameSchema = Schema(layers: [:])

func createEngineRouter() -> EngineRouter {
  let router = EngineRouter.default()
  router.post(
    CompileFrameSchemaPayload.self, 
    at: "compileFrameSchema") 
  { 
    httpRequest, compileFrameSchemaPayload -> Future<Response> in
    let frameSchemaSourceUrl = URL(
      fileURLWithPath: "./FrameSchema/Sources/FrameSchema/FrameSchemaLayers.swift")
    try compileFrameSchemaPayload
      .sourceCode
      .write(
        to: frameSchemaSourceUrl,
        atomically: true,
        encoding: .utf8)
    let promiseResponse = httpRequest
      .eventLoop
      .newPromise(Response.self)
    let buildProcess = Process()
    buildProcess.executableURL = URL(
      fileURLWithPath:"/usr/bin/swift")
    buildProcess.arguments = [
      "build", 
      "--package-path", 
      "./FrameSchema"
    ]
    buildProcess.terminationHandler = { 
      terminatedProcess in
      if terminatedProcess.terminationStatus == 0 {
        let compiledLibraryUrl = URL(
          fileURLWithPath: "./FrameSchema/.build/x86_64-unknown-linux/debug/libFrameSchema.so")
        let compiledLibraryData = try! Data(
          contentsOf: compiledLibraryUrl)
        let compiledLibraryResponse = httpRequest
          .response(
            compiledLibraryData, 
            as: MediaType.binary)        
        promiseResponse.succeed(
          result: compiledLibraryResponse)
      }
      else {
        promiseResponse.succeed(
          result: httpRequest.response(
            http: HTTPResponse(
              status: .badRequest)))
      }      
    }
    buildProcess.launch()
    return promiseResponse.futureResult
  }
  router.post(
    LoadFrameSchemaPayload.self,
    at: "loadFrameSchema") 
  {
    httpRequest, loadFrameSchemaPayload -> HTTPStatus in      
    let targetLibUrl = URL(
      fileURLWithPath: "./libFrameSchema.so")
    try loadFrameSchemaPayload
      .sharedObject
      .write(
        to: targetLibUrl, 
        options: .atomic)
    if _frameSchemaLibHandle != nil {
      dlclose(_frameSchemaLibHandle!)
    }
    _frameSchemaLibHandle = dlopen(
      "./libFrameSchema.so", 
      RTLD_NOW)    
    let getFrameSchemaSymbolName = "getFrameSchema"
    let maybeGetFrameSchemaSymbol = dlsym(
      _frameSchemaLibHandle, 
      getFrameSchemaSymbolName)
    guard let getFrameSchemaSymbol = maybeGetFrameSchemaSymbol 
    else {
      return .badRequest
    }
    let getFrameSchemaPointer = unsafeBitCast(
      getFrameSchemaSymbol, 
      to: GetFrameSchemaClosure.self)
    let frameSchemaPointer = getFrameSchemaPointer()
    // todo - safe schema retrieval
    // will crash when `frameSchemaPointer` does not 
    // point to a valid FrameInterface.Schema instance
    _frameSchema = Unmanaged<Schema>
      .fromOpaque(frameSchemaPointer)
      .takeRetainedValue()
    return .ok
  }
  router.post(
    RenderFrameImagePayload.self, 
    at: "renderFrameImage") 
  { 
    httpRequest, renderFrameImagePayload -> Response in
    do {
      let frameData = try Frame.render(
        width: renderFrameImagePayload.width, 
        height: renderFrameImagePayload.height, 
        layers: renderFrameImagePayload.layers)    
      let imageResponse = httpRequest.response(
        frameData, 
        as: MediaType.png)
      return imageResponse 
    }    
    catch let renderError {
      let badRequestResponse = HTTPResponse(
        status: .badRequest)
      return httpRequest.response(
        http: badRequestResponse)
    }
  }
  return router
}

struct CompileFrameSchemaPayload: Content {
  let sourceCode: String
}

struct LoadFrameSchemaPayload: Content {
  let sharedObject: Data
}

struct RenderFrameImagePayload: Content {
  let width: Double 
  let height: Double
  let layers: [Frame.AnyLayer]
}

extension Frame.AnyLayer: Decodable {
  init(from decoder: Decoder) throws {
    let keysContainer = try decoder.container(
      keyedBy: CodingKeys.self)
    let layerType = try keysContainer.decode(
      String.self,
      forKey: .type)
    guard let LayerType = _frameSchema.layers[layerType] else {
      throw SchemaError.layerNotFound
    }
    let layerDecoder = try keysContainer.superDecoder(
        forKey: .inputs)
    let baseLayer = try LayerType.init(
      from: layerDecoder)
    self.init(
      base: baseLayer)    
  }

  private 
  enum CodingKeys: String, CodingKey {
    case type, inputs
  }

  private
  enum SchemaError: Error {
    case layerNotFound
  }
}

extension Frame.AnyLayer: Encodable {
  public 
  func encode(to encoder: Encoder) throws {
    fatalError("WTF?")
  }
}