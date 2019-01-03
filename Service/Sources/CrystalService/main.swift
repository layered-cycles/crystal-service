import PerfectHTTP
import PerfectHTTPServer
 
let testRoute = 
  Route(
    method: .get, 
    uri: "/",
    handler: {
      request, response in
      response.setHeader(
        .contentType, 
        value: "text/plain")
      response.appendBody(
        string: "Hello, World!!!")
          .completed()
    }) 
let serviceRoutes = 
  Routes([testRoute])
try! HTTPServer.launch(
  .server(
    name: "localhost", 
    port: 8181, 
    routes: serviceRoutes))