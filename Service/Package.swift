// swift-tools-version:4.2
import PackageDescription

let package = Package(
  name: "CrystalService",
  dependencies: [
    .package(
        url: "https://github.com/vapor/vapor.git", 
        from: "3.0.0"),
    .package(
        url: "../Skia",
        from: "0.0.0")
  ],
  targets: [
    .target(
        name: "CrystalService",
        dependencies: ["Vapor", "Skia"])
  ]
)
