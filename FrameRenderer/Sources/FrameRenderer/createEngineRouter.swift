import Vapor 
import Skia
import FrameInterface

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
    httpRequest, compileFrameSchemaPayload -> Response in
    compileFrameSchemaPayload.sourceCode
    return httpRequest.response()  
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
    let getFrameSchemaSymbol = dlsym(
      _frameSchemaLibHandle, 
      getFrameSchemaSymbolName)
    let getFrameSchemaPointer = unsafeBitCast(
      getFrameSchemaSymbol, 
      to: GetFrameSchemaClosure.self)
    let frameSchemaPointer = getFrameSchemaPointer()
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
    let frameData = Frame.render(
      width: renderFrameImagePayload.width, 
      height: renderFrameImagePayload.height, 
      layers: renderFrameImagePayload.layers)
    let imageResponse = httpRequest.response(
      frameData, 
      as: MediaType.png)
    return imageResponse   
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
    let LayerType = _frameSchema.layers[layerType]!
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
}

extension Frame.AnyLayer: Encodable {
  public 
  func encode(to encoder: Encoder) throws {
    fatalError("WTF?")
  }
}