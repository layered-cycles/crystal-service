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
    }
  }
}

function createApiChannel() {
  return new Promise(resolve => {
    const apiServer = Express()
    apiServer.use(Express.json())
    const apiChannel = eventChannel(emit => {
      apiServer.post('/api', (httpRequest, httpResponder) => {
        const apiRequest = {
          ...httpRequest.body,
          responder: httpResponder
        }
        emit({ apiRequest })
      })
      return () => null
    }, buffers.expanding())
    apiServer.listen(3000, () => resolve({ apiChannel }))
  })
}

function* loadFrameSchemaHandler(apiResponder, { sourceCode }) {
  const { sharedObject } = yield call(compileFrameSchemaSourceCode, {
    sourceCode
  })
  yield call(loadFrameSchemaLibrary, { sharedObject })
  apiResponder.send()
}

function compileFrameSchemaSourceCode({ sourceCode }) {
  return new Promise(resolve => {
    Request.post(
      {
        url: 'http://crystal_frame-renderer_1:8181/compileFrameSchema',
        formData: {
          sourceCode: decodeURIComponent(sourceCode)
        },
        encoding: null
      },
      (requestError, requestResponse, requestBody) => {
        if (requestError) throw requestError
        resolve({
          sharedObject: requestBody
        })
      }
    )
  })
}

function loadFrameSchemaLibrary({ sharedObject }) {
  return new Promise(resolve => {
    Request.post(
      {
        url: 'http://crystal_frame-renderer_1:8181/loadFrameSchema',
        formData: { sharedObject }
      },
      requestError => {
        if (requestError) throw requestError
        resolve()
      }
    )
  })
}
