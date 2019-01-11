import Skia

struct FooLayer: FrameLayer {
  static let type = "Foo"
  let center: Skia.Point
  let radius: Float
  let color: Skia.Color
  func draw(in canvas: Canvas) {
    let circlePath = Path()
    circlePath.addCircle(
      center: center, 
      radius: radius)
    canvas.drawPath(
      path: circlePath, 
      color: color)
      
  }
}
