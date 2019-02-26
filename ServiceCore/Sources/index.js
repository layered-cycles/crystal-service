const createSagaCore = require('create-saga-core')
const { spawn, call, take } = require('redux-saga/effects')
const { eventChannel, buffers } = require('redux-saga')
const Express = require('express')
const Request = require('request')

createSagaCore({ initializer })

function* initializer() {
  yield spawn(apiProcessor)
}

function* apiProcessor() {
  const { apiChannel } = yield call(createApiChannel)
  while (true) {
    const { apiRequest } = yield take(apiChannel)
    switch (apiRequest.type) {
      case 'LOAD_FRAME_SCHEMA':
        yield call(
          loadFrameSchemaHandler,
          apiRequest.responder,
          apiRequest.payload
        )
        continue
      case 'RENDER_FRAME_IMAGE':
        yield call(
          renderFrameImageHandler,
          apiRequest.responder,
          apiRequest.payload
        )
        continue
      default:
        const apiResponder = apiRequest.responder
        apiResponder.statusCode = 400
        apiResponder.send()
        continue
    }
  }
}

function createApiChannel() {
  return new Promise(resolve => {
    const apiServer = Express()
    const jsonMiddleware = Express.json()
    apiServer.use(jsonMiddleware)
    const apiChannel = eventChannel(emit => {
      apiServer.post('/api', (httpRequest, httpResponder) => {
        const httpRequestBodyIsInvalid =
          !httpRequest.body.hasOwnProperty('type') ||
          !httpRequest.body.hasOwnProperty('payload')
        if (httpRequestBodyIsInvalid) {
          httpResponder.statusCode = 400
          httpResponder.send()
          return
        }
        const apiRequest = {
          ...httpRequest.body,
          responder: httpResponder
        }
        emit({ apiRequest })
      })
      return () => null
    }, buffers.expanding())
    apiServer.listen(80, () => resolve({ apiChannel }))
  })
}

function* loadFrameSchemaHandler(apiResponder, { sourceCode }) {
  try {
    const { sharedObject } = yield call(compileFrameSchemaSourceCode, {
      sourceCode
    })
    yield call(loadFrameSchemaLibrary, { sharedObject })
    apiResponder.send()
  } catch {
    apiResponder.statusCode = 400
    apiResponder.send()
  }
}

function compileFrameSchemaSourceCode({ sourceCode }) {
  return new Promise((resolve, reject) => {
    Request.post(
      {
        url: 'http://frame-renderer/compileFrameSchema',
        formData: { sourceCode },
        encoding: null
      },
      (requestError, requestResponse, requestBody) => {
        if (requestError) {
          reject(requestError)
          return
        }
        if (requestResponse.statusCode === 400) {
          reject()
          return
        }
        resolve({
          sharedObject: requestBody
        })
      }
    )
  })
}

function loadFrameSchemaLibrary({ sharedObject }) {
  return new Promise((resolve, reject) => {
    Request.post(
      {
        url: 'http://frame-renderer/loadFrameSchema',
        formData: { sharedObject }
      },
      (requestError, requestResponse, requestBody) => {
        if (requestError) {
          reject(requestError)
          return
        }
        if (requestResponse.statusCode === 400) {
          reject()
          return
        }
        resolve()
      }
    )
  })
}

function* renderFrameImageHandler(apiResponder, { width, height, layers }) {
  try {
    const { frameImageData } = yield call(renderFrameImage, {
      width,
      height,
      layers
    })
    apiResponder.contentType('png')
    apiResponder.send(frameImageData)
  } catch (renderError) {
    apiResponder.statusCode = 400
    apiResponder.send()
  }
}

function renderFrameImage(frameDescription) {
  return new Promise((resolve, reject) => {
    Request.post(
      {
        url: 'http://frame-renderer/renderFrameImage',
        json: frameDescription,
        encoding: null
      },
      (requestError, requestResponse, requestBody) => {
        if (requestError) {
          reject(requestError)
          return
        }
        if (requestResponse.statusCode === 400) {
          reject()
          return
        }
        if (requestBody.error) {
          reject(requestBody.reason)
          return
        }
        resolve({
          frameImageData: requestBody
        })
      }
    )
  })
}
