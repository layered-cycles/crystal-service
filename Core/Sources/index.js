const Http = require('http')
const createSagaCore = require('create-saga-core')
const { spawn, call, take } = require('redux-saga/effects')
const { eventChannel, buffers } = require('redux-saga')

createSagaCore({ initializer })

function* initializer() {
  yield spawn(apiProcessor)
}

function* apiProcessor() {
  const { apiChannel } = yield call(createApiChannel)
  while (true) {
    const { apiRequest } = yield take(apiChannel)
    console.log(apiRequest.type)
    console.log(apiRequest.payload)
  }
}

function createApiChannel() {
  return new Promise(resolve => {
    const apiServer = Http.createServer()
    const apiChannel = eventChannel(emit => {
      apiServer.on('request', (httpRequest, httpResponse) => {
        const validApiRequest =
          httpRequest.url === '/api' && httpRequest.method === 'POST'
        if (validApiRequest) {
          parseApiRequestBody({
            apiRequest: httpRequest
          }).then(({ apiRequestBody }) => {
            const apiRequest = {
              ...apiRequestBody,
              responder: httpResponse
            }
            emit({ apiRequest })
          })
        } else {
          httpResponse.statusCode = 400
          httpResponse.end()
        }
      })
      return () => null
    }, buffers.expanding())
    apiServer.listen(3000, () => resolve({ apiChannel }))
  })
}

function parseApiRequestBody({ apiRequest }) {
  return new Promise(resolve => {
    let requestData = []
    apiRequest
      .on('data', requestChunk => {
        requestData.push(requestChunk)
      })
      .on('end', () => {
        let apiRequestBody = JSON.parse(requestData)
        resolve({ apiRequestBody })
      })
  })
}
