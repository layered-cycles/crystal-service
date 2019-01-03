const Child = require('child_process')
const { eventChannel, buffers } = require('redux-saga')
const { call, spawn, select, put, take } = require('redux-saga/effects')
const createSagaCore = require('create-saga-core')
const createFileWatcher = require('node-watch')

const ActionType = {
  CRYSTAL_SERVICE_STARTED: 'CRYSTAL_SERVICE_STARTED__ACTION_TYPE'
}

const SourceChangeMessageType = {
  UPDATED: 'UPDATED__SOURCE_CHANGE_MESSAGE_TYPE',
  REMOVED: 'REMOVED__SOURCE_CHANGE_MESSAGE_TYPE'
}

createSagaCore({ reducer, initializer }).then(store => {})

function reducer(state = { crystalServiceContainerId: null }, action) {
  switch (action.type) {
    case ActionType.CRYSTAL_SERVICE_STARTED:
      const { crystalServiceContainerId } = action.payload
      return { ...state, crystalServiceContainerId }
    default:
      return state
  }
}

function* initializer() {
  const { buildServerContainerId } = yield call(buildServerInitializer)
  yield call(crystalServiceUpdater, { buildServerContainerId })
  yield spawn(serviceProcessor, { buildServerContainerId })
}

function* buildServerInitializer() {
  yield call(buildServerImageBuilder)
  yield call(tempDirectoryMaker)
  const { buildServerContainerId } = yield call(buildServerContainerStarter)
  return { buildServerContainerId }
}

function buildServerImageBuilder() {
  return new Promise(resolve => {
    console.log('building crystal-development image...')
    Child.exec(
      'docker build -t crystal-development -f ../Development.Dockerfile ../',
      (buildError, buildOutput) => {
        if (buildError) throw buildError
        console.log(buildOutput)
        resolve()
      }
    )
  })
}

function tempDirectoryMaker() {
  return new Promise(resolve => {
    console.log('making Temp directory...')
    console.log('')
    Child.exec('mkdir -p Temp', (makeError, makeOutput) => {
      if (makeError) throw makeError
      resolve()
    })
  })
}

function buildServerContainerStarter() {
  return new Promise(resolve => {
    console.log('starting crystal-development container...')
    Child.exec(
      'docker run -t -i -d crystal-development',
      (startError, containerId) => {
        if (startError) throw startError
        const buildServerContainerId = containerId.substring(0, 12)
        console.log(`---> ${buildServerContainerId}`)
        console.log('')
        resolve({ buildServerContainerId })
      }
    )
  })
}

function* crystalServiceUpdater({ buildServerContainerId }) {
  yield call(crystalServiceExecutableBuilder, { buildServerContainerId })
  yield call(crystalServiceExecutableTransferer, { buildServerContainerId })
  yield call(crystalServiceImageBuilder)
  yield call(crystalServiceContainerCleaner)
  const { crystalServiceContainerId } = yield call(
    crystalServiceContainerStarter
  )
  yield put({
    type: ActionType.CRYSTAL_SERVICE_STARTED,
    payload: { crystalServiceContainerId }
  })
}

function crystalServiceExecutableBuilder({ buildServerContainerId }) {
  return new Promise(resolve => {
    console.log('buidling CrystalService executable...')
    const buildProcess = Child.spawn(
      'docker',
      [
        'exec',
        '-it',
        buildServerContainerId,
        'swift',
        'build',
        '--package-path',
        './Service'
      ],
      {
        stdio: 'inherit'
      }
    )
    buildProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function crystalServiceExecutableTransferer({ buildServerContainerId }) {
  return new Promise(resolve => {
    console.log('transferring CrystalService executable...')
    const transferProcess = Child.spawn(
      'docker',
      [
        'cp',
        `${buildServerContainerId}:/CrystalDevelopment/Service/.build/x86_64-unknown-linux/debug/CrystalService`,
        './Temp'
      ],
      {
        stdio: 'inherit'
      }
    )
    transferProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function crystalServiceImageBuilder() {
  return new Promise(resolve => {
    console.log('building crystal-service image...')
    Child.exec(
      'docker build -t crystal-service -f ../Service.Dockerfile ../',
      (buildError, buildOutput) => {
        if (buildError) throw buildError
        console.log(buildOutput)
        resolve()
      }
    )
  })
}

function* crystalServiceContainerCleaner() {
  const { activeCrystalServiceContainerId } = yield select(state => ({
    activeCrystalServiceContainerId: state.crystalServiceContainerId
  }))
  if (activeCrystalServiceContainerId) {
    yield call(crystalServiceContainerKiller, {
      activeCrystalServiceContainerId
    })
  }
}

function crystalServiceContainerKiller({ activeCrystalServiceContainerId }) {
  return new Promise(resolve => {
    console.log('stopping crystal-service container...')
    Child.exec(
      `docker container kill ${activeCrystalServiceContainerId}`,
      (stopError, containerId) => {
        if (stopError) throw stopError
        console.log(`---> ${containerId}`)
        resolve()
      }
    )
  })
}

function crystalServiceContainerStarter() {
  return new Promise(resolve => {
    console.log('starting crystal-service container...')
    Child.exec(
      'docker run -t -i -d -p 8181:8181 crystal-service',
      (startError, containerId) => {
        if (startError) throw startError
        const crystalServiceContainerId = containerId.substring(0, 12)
        console.log(`---> ${crystalServiceContainerId}`)
        console.log('')
        resolve({ crystalServiceContainerId })
      }
    )
  })
}

function* serviceProcessor({ buildServerContainerId }) {
  const { sourceChangeChannel } = yield call(sourceChangeWatcher)
  while (true) {
    const changeMessage = yield take(sourceChangeChannel)
    switch (changeMessage.type) {
      case SourceChangeMessageType.UPDATED:
        const { updatedFilePath } = changeMessage.payload
        yield call(sourceFileCopier, {
          buildServerContainerId,
          updatedFilePath
        })
        yield call(crystalServiceUpdater, { buildServerContainerId })
        continue
      case SourceChangeMessageType.REMOVED:
        const { removedFilePath } = changeMessage.payload
        yield call(sourceFileRemover, {
          buildServerContainerId,
          removedFilePath
        })
        yield call(crystalServiceUpdater, { buildServerContainerId })
        continue
    }
  }
}

function sourceChangeWatcher() {
  return new Promise(resolve => {
    const sourceChangeChannel = eventChannel(emitMessage => {
      createFileWatcher(
        ['../Service/Sources'],
        {
          recursive: true
        },
        (fileEvent, filePath) => {
          switch (fileEvent) {
            case 'update':
              emitMessage({
                type: SourceChangeMessageType.UPDATED,
                payload: {
                  updatedFilePath: filePath
                }
              })
              return
            case 'remove':
              emitMessage({
                type: SourceChangeMessageType.REMOVED,
                payload: {
                  removedFilePath: filePath
                }
              })
              return
          }
        }
      )
      return () => null
    }, buffers.expanding())
    resolve({ sourceChangeChannel })
  })
}

function sourceFileCopier({ buildServerContainerId, updatedFilePath }) {
  return new Promise(resolve => {
    const relativeBuildServerTargetPath = updatedFilePath.substring(3)
    console.log('transferring updated source file...')
    const transferProcess = Child.spawn(
      'docker',
      [
        'cp',
        updatedFilePath,
        `${buildServerContainerId}:/CrystalDevelopment/${relativeBuildServerTargetPath}`
      ],
      {
        stdio: 'inherit'
      }
    )
    transferProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function sourceFileRemover({ buildServerContainerId, removedFilePath }) {
  return new Promise(resolve => {
    const relativeBuildServerTargetPath = removedFilePath.substring(3)
    console.log('removing source file...')
    const removeProcess = Child.spawn(
      'docker',
      [
        'exec',
        buildServerContainerId,
        'rm',
        '-f',
        `/CrystalDevelopment/${relativeBuildServerTargetPath}`
      ],
      {
        stdio: 'inherit'
      }
    )
    removeProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}
