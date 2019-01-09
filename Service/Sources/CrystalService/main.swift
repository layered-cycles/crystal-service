import Vapor
import Skia

struct FooLayer: FrameLayer {
  static let type = "Foo"
  let centerX: Float
  let centerY: Float
  let radius: Float
  func draw(in canvas: Canvas) {
    canvas.drawCircle(
      centerX: centerX, 
      centerY: centerY, 
      radius: radius)
  }
}

extension AnyFrameLayer: Decodable {
  public 
  init(from decoder: Decoder) throws {
    let keysContainer = try decoder.container(
      keyedBy: CodingKeys.self)
    let layerType = try keysContainer.decode(
      String.self,
      forKey: .type)
    let LayerType = FrameLayerManager
      .availableLayerTypes[layerType]!
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

class FrameLayerManager {
  static let availableLayerTypes: [String: FrameLayer.Type] = [
    FooLayer.type: FooLayer.self
  ]
}

enum ApiRequest: Content {
  case renderImage(RenderImagePayload)
}

extension ApiRequest: Decodable {
  init(from decoder: Decoder) throws {
    let keysContainer = try decoder.container(
      keyedBy: CodingKeys.self)
    let requestType = try keysContainer.decode(
      String.self, 
      forKey: .type)
    switch requestType {
      case "RENDER_IMAGE":
        let renderImagePayload = try keysContainer.decode(
          RenderImagePayload.self, 
          forKey: .payload) 
        self = .renderImage(renderImagePayload)
      default:
        throw ApiRequestDecodingError.unrecognizedRequestType
    }
  }
  private 
  enum CodingKeys: String, CodingKey {
    case type, payload
  }
  enum ApiRequestDecodingError: Error {
    case unrecognizedRequestType
  }
}

extension ApiRequest: Encodable {
  func encode(to encoder: Encoder) throws {
    throw ApiRequestEncodingError.wtf
  }
  enum ApiRequestEncodingError: Error {
    case wtf
  }
}

struct RenderImagePayload: Decodable {
  let width: Int 
  let height: Int
  let layers: [AnyFrameLayer]
}

let serviceConfig = Config.default()
let serviceEnvironment = try Environment.detect()
var serviceServices = Services.default()
let serverConfig = NIOServerConfig.default(
  hostname: "0.0.0.0",
  port: 8181)
serviceServices.register(serverConfig)
let router = EngineRouter.default()
router.post(
  ApiRequest.self, 
  at: "api") { 
    httpRequest, apiRequest -> Response in
    switch apiRequest {
    case .renderImage(let renderImagePayload):
      let frameData = Frame.render(
        width: renderImagePayload.width, 
        height: renderImagePayload.height, 
        layers: renderImagePayload.layers)
      let imageResponse = httpRequest.response(
        frameData, 
        as: MediaType.png)
      return imageResponse
    }
  }
serviceServices.register(
  router, 
  as: Router.self)
let app = try Application(
  config: serviceConfig, 
  environment: serviceEnvironment, 
  services: serviceServices)
try app.run()