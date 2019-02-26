
public final class Schema {
  public let layers: [String: Layer.Type]
  
  public init(layers: [String: Layer.Type]) {
    self.layers = layers
  }
}

public protocol Layer: Decodable {
  static var layerType: String { get }

  func draw(
    inCanvas canvas: Canvas)
}

public protocol Canvas {
  var width: Double { get }
  var height: Double { get }

  func fill(
    path: Path, 
    color: Color)
    
  var Path: () -> Path { get }
}

public protocol Path {
  init()

  func addCircle(
    center: Point, 
    radius: Double)

  func addRectangle(
    left: Double, 
    top: Double,
    right: Double,
    bottom: Double)
}

public struct Point: Decodable {
  public var x: Double
  public var y: Double
  
  public init(
    x: Double, 
    y: Double) 
  {
    self.x = x
    self.y = y
  }
}

public struct Color: Decodable {
  public var hue: Double
  public var saturation: Double
  public var value: Double

  public init(
    hue: Double, 
    saturation: Double, 
    value: Double) 
  {
    self.hue = hue
    self.saturation = saturation
    self.value = value
  }
}

