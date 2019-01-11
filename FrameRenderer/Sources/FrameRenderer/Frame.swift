 import Foundation
 import SkiaLib
 
 enum Frame {
  static func render(
    width: Int, 
    height: Int, 
    layers: [AnyFrameLayer]) -> Data
  { 
    var renderFrameCallbacks = RenderFrameCallbacks(
      onRender: { 
        (canvasPointer, layersPointer) in    
        let canvas = Canvas(canvasPointer) 
        let refreshedLayersRef = Unmanaged<FrameLayersRef>
          .fromOpaque(layersPointer)
          .takeUnretainedValue()
        for layer in refreshedLayersRef.value {
          layer.base.draw(
            in: canvas)
        }
      },
      onRendered: {
        (dataPointer, byteCount, resultDataPointer) in
        let refreshedResultRef = Unmanaged<FrameDataRef>
          .fromOpaque(resultDataPointer)
          .takeUnretainedValue()
        refreshedResultRef.value = Data(
          bytes: dataPointer, 
          count: Int(byteCount))
      })
    let layersRef = FrameLayersRef(layers)
    let unmanagedLayersRef = Unmanaged
      .passUnretained(layersRef)
      .toOpaque()
    let frameLayersPointer = UnsafeMutableRawPointer(unmanagedLayersRef) 
    let resultRef = FrameDataRef()
    let unmanagedResultRef = Unmanaged
      .passUnretained(resultRef)
      .toOpaque()
    let resultPointer = UnsafeMutableRawPointer(unmanagedResultRef) 
    renderFrame(
      Int32(width), 
      Int32(height),
      frameLayersPointer,
      resultPointer,
      &renderFrameCallbacks)
    return resultRef.value
  }
}

final class FrameLayersRef {
  let value: [AnyFrameLayer] 
  init(_ layers: [AnyFrameLayer]) {
    value = layers
  }
}

final class FrameDataRef {
  var value = Data()
}

struct AnyFrameLayer {
  let base: FrameLayer
  init(base: FrameLayer) {
    self.base = base
  }
}

protocol FrameLayer: Decodable {
  static var type: String { get }
  func draw(in canvas: Canvas)
}

struct Canvas {
  let pointer: UnsafeMutableRawPointer
  init(_ canvasPointer: UnsafeMutableRawPointer) {
    pointer = canvasPointer
  }
  func drawPath(path: Path, color: SkiaLib.Color) {
    SkiaLib.drawPath(
      path.skiaPathKey,
      color,
      pointer)
  }
}

final class Path {
  let skiaPathKey: Int32
  init() {
    skiaPathKey = SkiaLib.initPath()
  }
  deinit {
    SkiaLib.deinitPath(skiaPathKey)
  }  
}

extension Path {
  func addCircle(center: SkiaLib.Point, radius: Float) {
    SkiaLib.addCircleToPath(
      center, 
      radius, 
      skiaPathKey)
  }
}