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
  func createPath() -> Path 
}

public
protocol Path {
  func addCircle(
    withCenter center: Point,
    withRadius radius: Double)
}

public
struct Point: Decodable {
  public
  var x: Double
  public
  var y: Double
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

