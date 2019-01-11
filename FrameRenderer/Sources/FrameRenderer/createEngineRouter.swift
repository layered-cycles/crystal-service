import Vapor 
import Skia

func createEngineRouter() -> EngineRouter {
  let router = EngineRouter.default()
  router.post(
    ApiRequest.self, 
    at: "api") 
  { 
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
  let width: Int 
  let height: Int
  let layers: [AnyFrameLayer]
}

extension AnyFrameLayer: Decodable {
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

extension Skia.Point: Decodable {
  public
  init(from decoder: Decoder) throws {
    let keysContainer = try decoder.container(
      keyedBy: CodingKeys.self)
    let xVal = try keysContainer.decode(
      Float.self,
      forKey: .x)
    let yVal = try keysContainer.decode(
      Float.self,
      forKey: .y)
    self.init(
      x: xVal, 
      y: yVal)
  }
  private 
  enum CodingKeys: String, CodingKey {
    case x, y
  }
}

extension Skia.Color: Decodable {
  public
  init(from decoder: Decoder) throws {
    let keysContainer = try decoder.container(
      keyedBy: CodingKeys.self)
    let hue = try keysContainer.decode(
      Float.self,
      forKey: .hue)
    let saturation = try keysContainer.decode(
      Float.self,
      forKey: .saturation)
    let value = try keysContainer.decode(
      Float.self,
      forKey: .value)
    self.init(
      hue: hue, 
      saturation: saturation,
      value: value)
  }
  private 
  enum CodingKeys: String, CodingKey {
    case hue, saturation, value
  }
}