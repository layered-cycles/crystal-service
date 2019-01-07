import Vapor
import SkiaLib

testSkiaLib()

protocol CrystalLayer: Decodable {
  static var type: String { get }
  func draw()
}

struct FooLayer: CrystalLayer {
  static let type = "Foo"
  var foo: String
  func draw() {
    print(foo)
  }
}

struct BarLayer: CrystalLayer {
  static let type = "Bar"
  var bar: String
  func draw() {
    print(bar)
  }
}

struct AnyCrystalLayer {
  var base: CrystalLayer
}

extension AnyCrystalLayer: Decodable {
  init(from decoder: Decoder) throws {
    let keysContainer = try decoder.container(
      keyedBy: CodingKeys.self)
    let layerType = try keysContainer.decode(
      String.self,
      forKey: .type)
    let LayerType = CrystalLayerManager
      .availableLayerTypes[layerType]!
    let layerDecoder = try keysContainer.superDecoder(
      forKey: .inputs)
    base = try LayerType.init(
      from: layerDecoder)
  }
  private enum CodingKeys: String, CodingKey {
    case type, inputs
  }
}

class CrystalLayerManager {
  static let availableLayerTypes: [String: CrystalLayer.Type] = [
    FooLayer.type: FooLayer.self, 
    BarLayer.type: BarLayer.self
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
  private enum CodingKeys: String, CodingKey {
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
  let layers: [AnyCrystalLayer]
}

enum ApiResponse: Content {
  case imageRendered(ImageRenderedPayload)
}

extension ApiResponse: Encodable {
  func encode(to encoder: Encoder) throws {
    var keysContainer = encoder.container(
      keyedBy: CodingKeys.self)
    switch self {
      case .imageRendered(let imageRenderedPayload):
        try keysContainer.encode(
          "IMAGE_RENDERED",
          forKey: .type)
        try keysContainer.encode(
          imageRenderedPayload, 
          forKey: .payload)
    }
  }
  private enum CodingKeys: String, CodingKey {
    case type, payload
  }
}

extension ApiResponse: Decodable {
  init(from decoder: Decoder) throws {
    throw ApiResponseDecodingError.wtf
  }
  enum ApiResponseDecodingError: Error {
    case wtf
  }
}

struct ImageRenderedPayload: Encodable {
  let url: String
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
    _, apiRequest -> ApiResponse in
    switch apiRequest {
      case .renderImage(let renderImagePayload):
        let imageRenderedPayload = ImageRenderedPayload(
          url: "http://localhost:8181/image/test")
        return .imageRendered(
          imageRenderedPayload)
    }
  }
router.get("image", String.parameter) { 
  imageRequest -> Response in
  let imageName = try imageRequest
    .parameters
    .next(String.self)
  let filePath = "./\(imageName).png"
  let fileUrl = URL(
    fileURLWithPath: filePath)  
  let imageData = try Data(
    contentsOf: fileUrl)
  let imageResponse = imageRequest
    .response(
      imageData, 
      as: MediaType.png)
  return imageResponse
}
serviceServices.register(
  router, 
  as: Router.self)
let app = try Application(
  config: serviceConfig, 
  environment: serviceEnvironment, 
  services: serviceServices)
try app.run()