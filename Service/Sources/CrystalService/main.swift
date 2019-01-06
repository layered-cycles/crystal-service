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

enum CrystalRequest: Content {
  case renderImage(RenderImagePayload)
}

extension CrystalRequest: Decodable {
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
        throw CrystalRequestDecodingError.unrecognizedRequestType
    }
  }
  private 
  enum CodingKeys: String, CodingKey {
    case type
    case payload
  }
  enum CrystalRequestDecodingError: Error {
    case unrecognizedRequestType
  }
}

extension CrystalRequest: Encodable {
  enum CrystalRequestEncodingError: Error {
    case wtf
  }
  func encode(to encoder: Encoder) throws {
    throw CrystalRequestEncodingError.wtf
  }
}

struct RenderImagePayload: Decodable {
  let layers: [AnyCrystalLayer]
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
  CrystalRequest.self, 
  at: "api") { 
    _, crystalRequest -> String in
    switch crystalRequest {
      case .renderImage(let renderImagePayload):
        return renderImagePayload
          .layers
          .reduce("") 
          { "\($0)\($1.base)\n" }
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