struct FooLayer: FrameLayer {
  static let type = "Foo"
  let centerX: Float
  let centerY: Float
  let radius: Float
  func draw(in canvas: Canvas) {
    canvas.drawCircle(
      centerX: centerX, 
      centerY: centerY, 
      radius: radius)
  }
}