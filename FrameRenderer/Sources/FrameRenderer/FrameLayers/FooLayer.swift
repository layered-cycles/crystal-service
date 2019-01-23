import CrystalFrameInterface

struct FooLayer: Layer {
  static let type = "Foo"
  let center: Point
  let radius: Double
  let color: Color
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
