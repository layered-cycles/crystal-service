import Vapor 
import Skia
import FrameSchema

func createEngineRouter() -> EngineRouter {
  let router = EngineRouter.default()
  router.post(ApiRequest.self) { 
    httpRequest, apiRequest -> Response in
    switch apiRequest {
    case .renderFrame(let descriptionPayload):
      let frameData = Frame.render(
        width: descriptionPayload.width, 
        height: descriptionPayload.height, 
        layers: descriptionPayload.layers)
      let imageResponse = httpRequest.response(
        frameData, 
        as: MediaType.png)
      return imageResponse
    }
  }
  return router
}

enum ApiRequest: Content {
  case renderFrame(FrameDescription)
}

extension ApiRequest: Decodable {
  init(from decoder: Decoder) throws {
    let keysContainer = try decoder.container(
      keyedBy: CodingKeys.self)
    let requestType = try keysContainer.decode(
      String.self, 
      forKey: .type)
    switch requestType {
      case "RENDER_FRAME":
        let descriptionPayload = try keysContainer.decode(
          FrameDescription.self, 
          forKey: .payload) 
        self = .renderFrame(descriptionPayload)
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

struct FrameDescription: Decodable {
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
    let LayerType = getFrameSchema()[layerType]!
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