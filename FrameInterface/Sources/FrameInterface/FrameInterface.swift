
public 
final class Schema {
  public
  let layers: [String: Layer.Type]
  public
  init(layers: [String: Layer.Type]) {
    self.layers = layers
  }
}

public
protocol Layer: Decodable {
  static var type: String { get }
  func draw(
    inCanvas canvas: Canvas)
}

public
protocol Canvas {
  var width: Double { get }
  var height: Double { get }
  func fill(
    path: Path, 
    withColor color: Color)
  var Path: () -> Path { get }
}

public
protocol Path {
  init()
  func addCircle(
    withCenter: Point, 
    withRadius: Double)
  func addRectangle(
    withOrigin: Point, 
    withSize: Size)
}

public
struct Point: Decodable {
  public
  var x: Double
  public
  var y: Double
  public
  init(x: Double, y: Double) {
    self.x = x
    self.y = y
  }
}

public
struct Size: Decodable {
  public
  var width: Double 
  public
  var height: Double
  public
  init(width: Double, height: Double) {
    self.width = width
    self.height = height
  }
}

public
struct Color: Decodable {
  public
  var hue: Double
  public
  var saturation: Double
  public
  var value: Double
}

