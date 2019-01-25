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
  router.post("renderFrameImage") { 
    httpRequest -> Future<Response> in
    return try httpRequest
      .content
      .decode(RenderFrameImagePayload.self)
      .map(to: Response.self) 
    {
      renderFrameImagePayload in
      let frameData = Frame.render(
        width: renderFrameImagePayload.width, 
        height: renderFrameImagePayload.height, 
        layers: renderFrameImagePayload.layers)
      let imageResponse = httpRequest.response(
        frameData, 
        as: MediaType.png)
      return imageResponse
    }    
  }
  router.post("loadFrameSchema") {
    httpRequest -> Future<HTTPStatus> in
    return try httpRequest
      .content
      .decode(LoadFrameSchemaPayload.self)
      .map(to: HTTPStatus.self) 
    { 
      loadLayersLibraryPayload in      
      let targetLibUrl = URL(
        fileURLWithPath: "./libFrameSchema.so")
      try loadLayersLibraryPayload
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
  }
  return router
}

struct RenderFrameImagePayload: Decodable {
  let width: Double 
  let height: Double
  let layers: [Frame.AnyLayer]
}

struct LoadFrameSchemaPayload: Decodable {
  let sharedObject: Data
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