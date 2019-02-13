 import Foundation
 import Skia
 import FrameInterface
 
 enum Frame {
  static func render(
    width: Double, 
    height: Double, 
    layers: [AnyLayer]) throws -> Data 
  { 
    guard width > 0 && height > 0 
    else { 
      throw RenderError.invalidDimensions 
    }
    var renderFrameCallbacks = RenderFrameCallbacks(
      onRender: { 
        canvasPointer, frameWidth, frameHeight, layersPointer in    
        let canvas = Canvas(
          width: frameWidth,
          height: frameHeight, 
          skiaPointer: canvasPointer) 
        let frameLayers = Unmanaged<LayersRef>
          .fromOpaque(layersPointer)
          .takeUnretainedValue()
          .value
        for layer in frameLayers {
          layer.base.draw(
            inCanvas: canvas)
        }
      },
      onRendered: {
        dataPointer, byteCount, resultDataPointer in
        let refreshedResultRef = Unmanaged<DataRef>
          .fromOpaque(resultDataPointer)
          .takeUnretainedValue()
        refreshedResultRef.value = Data(
          bytes: dataPointer, 
          count: Int(byteCount))
      })
    let layersRef = LayersRef(layers)
    let unmanagedLayersRef = Unmanaged
      .passUnretained(layersRef)
      .toOpaque()
    let layersPointer = UnsafeMutableRawPointer(unmanagedLayersRef) 
    let resultRef = DataRef()
    let unmanagedResultRef = Unmanaged
      .passUnretained(resultRef)
      .toOpaque()
    let resultPointer = UnsafeMutableRawPointer(unmanagedResultRef) 
    renderFrame(
      width, 
      height,
      layersPointer,
      resultPointer,
      &renderFrameCallbacks)
    return resultRef.value
  }

  enum RenderError: Error {
    case invalidDimensions
  }

  final class LayersRef {
    let value: [AnyLayer] 

    init(
      _ layers: [AnyLayer]) 
    {
      value = layers
    }
  }

  final class DataRef {
    var value = Data()
  }

  struct AnyLayer {
    let base: Layer
  }

  struct Canvas {
    typealias PointType = Skia.Point

    let width: Double 
    let height: Double
    let skiaPointer: UnsafeMutableRawPointer

    init(
      width: Double, 
      height: Double, 
      skiaPointer: UnsafeMutableRawPointer) 
    {
      self.width = width 
      self.height = height
      self.skiaPointer = skiaPointer
    }
  }

  final class Path {
    let skiaPointer: UnsafeMutableRawPointer
    let skiaKey: Int32

    init() {
      let pathPair = Skia.initPath()
      self.skiaPointer = pathPair.pointer
      self.skiaKey = pathPair.key
    }

    deinit {
      Skia.deinitPath(self.skiaKey)
    }  
  }
}

extension Frame.Canvas: FrameInterface.Canvas {
  var Path: () -> FrameInterface.Path {
    return Frame.Path.init
  }

  func fill(
    path: FrameInterface.Path, 
    color: FrameInterface.Color) 
  {
    let framePath = path as! Frame.Path
    Skia.drawPath(framePath.skiaPointer, color.skiaColor, self.skiaPointer)
  }
}

extension Frame.Path: FrameInterface.Path {
  func addCircle(
    center: FrameInterface.Point, 
    radius: Double) 
  {
    Skia.addCircleToPath(center.skiaPoint, radius, self.skiaPointer)
  }

  func addRectangle(
    left: Double,
    top: Double,
    right: Double,
    bottom: Double) 
  {
    Skia.addRectangleToPath(left, top, right, bottom, self.skiaPointer)
  }
}

extension FrameInterface.Point {
  var skiaPoint: Skia.Point {
    return Skia.Point(
      x: self.x, 
      y: self.y)
  }
}

extension FrameInterface.Color {
  var skiaColor: Skia.Color {
    return Skia.Color(
      hue: self.hue, 
      saturation: self.saturation,
      value: self.value)
  }
}