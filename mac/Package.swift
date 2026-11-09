// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "Gabarita",
    platforms: [.macOS(.v13)],
    targets: [.executableTarget(name: "Gabarita", path: "Sources/Gabarita")]
)
