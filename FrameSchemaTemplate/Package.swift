// swift-tools-version:4.2
import PackageDescription

let package = Package(
  name: "FrameSchema",
  products: [
    .library(
      name: "FrameSchema",
      type: .dynamic,
      targets: ["FrameSchema"])
    ],
  dependencies: [
    .package(
      url: "../FrameInterface",
      from: "0.1.0")
  ],
  targets: [
    .target(
      name: "FrameSchema",
      dependencies: ["FrameInterface"])
  ]
)
