// swift-tools-version:4.2
import PackageDescription

let package = Package(
  name: "Skia",
  products: [
    .library(
      name: "Skia",
      targets: ["Skia"]),
  ],
  dependencies: [
    .package(
      url: "../SkiaLib", 
      from: "0.0.0")
  ],
  targets: [
    .target(
      name: "Skia",
      dependencies: ["SkiaLib"])
  ]
)
