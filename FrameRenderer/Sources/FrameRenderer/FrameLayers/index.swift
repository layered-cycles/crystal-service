import CrystalFrameInterface 

final class FrameLayerManager {
  static let availableLayerTypes: [String: CrystalFrameInterface.Layer.Type] = [
    FooLayer.type: FooLayer.self
  ]
}