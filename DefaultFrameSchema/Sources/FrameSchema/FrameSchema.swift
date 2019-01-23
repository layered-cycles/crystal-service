import FrameInterface

public
func getFrameSchema() -> [String: Layer.Type] {
  return [
    CircleLayer.type: CircleLayer.self
  ]
}

public
struct CircleLayer: Layer {
  public
  static let type = "Circle"
  public
  let center: Point
  public
  let radius: Double
  public
  let color: Color
  public
  func draw(
    inCanvas canvas: Canvas) 
  {
    let circlePath = canvas.createPath()
    circlePath.addCircle(
      withCenter: center, 
      withRadius: radius)
    canvas.fill(
      path: circlePath, 
      withColor: color)      
  }
}
