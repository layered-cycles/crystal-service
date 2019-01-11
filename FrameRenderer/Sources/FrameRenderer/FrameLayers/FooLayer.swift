import SkiaLib

struct FooLayer: FrameLayer {
  static let type = "Foo"
  let center: SkiaLib.Point
  let radius: Float
  let color: SkiaLib.Color
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
