// swift-tools-version:4.2
import PackageDescription

let package = Package(
  name: "FrameRenderer",
  dependencies: [
    .package(
      url: "https://github.com/vapor/vapor.git", 
      from: "3.0.0"),
    .package(
      url: "../Skia", 
      from: "0.0.0"),
    .package(
      url: "https://github.com/refectjam/CrystalFrameInterface.git",
      .branch("next"))
  ],
  targets: [
    .target(
        name: "FrameRenderer",
        dependencies: ["Vapor", "Skia", "CrystalFrameInterface"])
  ]
)
