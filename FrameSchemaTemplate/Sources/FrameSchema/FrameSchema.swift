import FrameInterface

@_silgen_name("getFrameSchema")
public func getFrameSchema() -> Schema {  
  return Schema(
    layers: SchemaProvider.layers)
}