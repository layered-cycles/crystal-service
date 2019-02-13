import Vapor

let vaporConfig = Config.default()
let vaporEnvironment = try Environment.detect()
var vaporServices = Services.default()
let serverConfig = NIOServerConfig.default(
  hostname: "0.0.0.0",
  port: 80)
vaporServices.register(serverConfig)
let vaporRouter = createEngineRouter()
vaporServices.register(
  vaporRouter, 
  as: Router.self)
let vaporApp = try Application(
  config: vaporConfig, 
  environment: vaporEnvironment, 
  services: vaporServices)
try vaporApp.run()