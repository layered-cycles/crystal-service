import Vapor

enum CrystalRequest: Content {
  case renderImage(RenderImagePayload)
}

extension CrystalRequest: Decodable {
  private 
  enum CodingKeys: String, CodingKey {
    case type
    case payload
  }

  enum CrystalRequestDecodingError: Error {
    case unrecognizedRequestType
  }

  init(from decoder: Decoder) throws {
    let values = try decoder.container(
      keyedBy: CodingKeys.self)
    let requestType = try values.decode(
      String.self, 
      forKey: .type)
    switch requestType {
      case "RENDER_IMAGE":
        let renderImagePayload = try values.decode(
          RenderImagePayload.self, 
          forKey: .payload) 
        self = .renderImage(renderImagePayload)
      default:
        throw CrystalRequestDecodingError.unrecognizedRequestType
    }
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

struct RenderImagePayload: Content {
  let test: String
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
        return renderImagePayload.test
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