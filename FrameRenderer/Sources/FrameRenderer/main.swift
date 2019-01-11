import Vapor

let serviceConfig = Config.default()
let serviceEnvironment = try Environment.detect()
var serviceServices = Services.default()
let serverConfig = NIOServerConfig.default(
  hostname: "0.0.0.0",
  port: 8181)
serviceServices.register(serverConfig)
let router = createEngineRouter()
serviceServices.register(
  router, 
  as: Router.self)
let app = try Application(
  config: serviceConfig, 
  environment: serviceEnvironment, 
  services: serviceServices)
try app.run()