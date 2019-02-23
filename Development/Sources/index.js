const Child = require('child_process')
const { eventChannel, buffers } = require('redux-saga')
const { call, spawn, take } = require('redux-saga/effects')
const createSagaCore = require('create-saga-core')
const createFileWatcher = require('node-watch')

const FRAME_INTERFACE_PATTERN = /^\.\.\/FrameInterface\/.+/

const SourceChangeMessageType = {
  UPDATED: 'UPDATED__SOURCE_CHANGE_MESSAGE_TYPE',
  REMOVED: 'REMOVED__SOURCE_CHANGE_MESSAGE_TYPE'
}

createSagaCore({ initializer })

function* initializer() {
  process.on('SIGINT', process.exit)
  const { buildServerContainerId } = yield call(initBuildServerContainer)
  const { coreContainerId, frameRendererContainerId } = yield call(
    initServiceContainers
  )
  yield call(updateCoreScript, { coreContainerId })
  yield call(updateFrameRendererExecutable, {
    buildServerContainerId,
    frameRendererContainerId
  })
  yield spawn(coreSourceProcessor, { coreContainerId })
  yield spawn(frameRendererSourceProcessor, {
    buildServerContainerId,
    frameRendererContainerId
  })
}

function* initBuildServerContainer() {
  yield call(buildBuildServerImage)
  yield call(makeTempDirectory)
  const { buildServerContainerId } = yield call(startBuildServerContainer)
  return { buildServerContainerId }
}

function buildBuildServerImage() {
  return new Promise(resolve => {
    const buildProcess = Child.spawn(
      'docker',
      [
        'build',
        '-t',
        'crystal-development',
        '-f',
        '../Development/Development.Dockerfile',
        '../'
      ],
      { stdio: 'inherit' }
    )
    buildProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function makeTempDirectory() {
  return new Promise(resolve => {
    console.log('making Temp directory...')
    console.log('')
    Child.exec('mkdir -p Temp', makeError => {
      if (makeError) throw makeError
      resolve()
    })
  })
}

function startBuildServerContainer() {
  return new Promise(resolve => {
    console.log('starting crystal-development container...')
    Child.exec(
      'docker run -itd crystal-development',
      (startError, containerId) => {
        if (startError) throw startError
        const buildServerContainerId = containerId.substring(0, 12)
        console.log(`---> ${buildServerContainerId}`)
        console.log('')
        process.on('exit', () =>
          Child.exec(`docker rm -f ${buildServerContainerId}`)
        )
        resolve({ buildServerContainerId })
      }
    )
  })
}

function* initServiceContainers() {
  yield call(composeServiceContainers)
  const { coreContainerId } = yield call(fetchCoreContainerId)
  const { frameRendererContainerId } = yield call(fetchFrameRendererContainerId)
  return { coreContainerId, frameRendererContainerId }
}

function composeServiceContainers() {
  return new Promise(resolve => {
    console.log('composing containers...')
    const composeUpProcess = Child.spawn('docker-compose', ['up', '--detach'], {
      stdio: 'inherit'
    })
    composeUpProcess.on('close', () => {
      console.log('')
      process.on('exit', () => {
        Child.spawn('docker-compose', ['down'], { stdio: 'inherit' })
      })
      resolve()
    })
  })
}

function fetchCoreContainerId() {
  console.log('fetching core container id...')
  console.log('')
  return new Promise(resolve => {
    Child.exec(
      'docker-compose --file ./docker-compose.yaml ps --quiet service-core',
      (fetchError, containerId) => {
        if (fetchError) throw fetchError
        const coreContainerId = containerId.substring(0, 12)
        resolve({ coreContainerId })
      }
    )
  })
}

function fetchFrameRendererContainerId() {
  console.log('fetching frame-renderer container id...')
  console.log('')
  return new Promise(resolve => {
    Child.exec(
      'docker-compose --file ./docker-compose.yaml ps --quiet frame-renderer',
      (fetchError, containerId) => {
        if (fetchError) throw fetchError
        const frameRendererContainerId = containerId.substring(0, 12)
        resolve({ frameRendererContainerId })
      }
    )
  })
}

function* updateCoreScript({ coreContainerId }) {
  yield call(stopActiveCoreScript, { coreContainerId })
  yield call(startNewCoreScript, { coreContainerId })
}

function stopActiveCoreScript({ coreContainerId }) {
  return new Promise(resolve => {
    console.log('stopping active core script...')
    const stopProcess = Child.spawn(
      'docker',
      ['exec', coreContainerId, 'pkill', '-f', 'node'],
      { stdio: 'inherit' }
    )
    stopProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function startNewCoreScript({ coreContainerId }) {
  return new Promise(resolve => {
    console.log('starting new core script...')
    console.log('')
    Child.spawn('docker', ['exec', coreContainerId, 'npm', 'start'], {
      stdio: 'inherit'
    })
    resolve()
  })
}

function* updateFrameRendererExecutable({
  buildServerContainerId,
  frameRendererContainerId
}) {
  yield call(buildFrameRendererExecutable, { buildServerContainerId })
  yield call(copyFrameRendererExecutableToHost, { buildServerContainerId })
  yield call(copyFrameRendererExecutableToFrameRendererContainer, {
    frameRendererContainerId
  })
  yield call(stopActiveFrameRendererExecutable, { frameRendererContainerId })
  yield call(startNewFrameRendererExecutable, { frameRendererContainerId })
}

function buildFrameRendererExecutable({ buildServerContainerId }) {
  return new Promise(resolve => {
    console.log('building frame renderer executable...')
    const buildProcess = Child.spawn(
      'docker',
      [
        'exec',
        buildServerContainerId,
        'swift',
        'build',
        '--package-path',
        './FrameRenderer',
        '-Xcxx',
        '-std=c++11',
        '-Xcxx',
        '-I/crystal-development/SkiaBuild/include/c',
        '-Xcxx',
        '-I/crystal-development/SkiaBuild/include/codec',
        '-Xcxx',
        '-I/crystal-development/SkiaBuild/include/config',
        '-Xcxx',
        '-I/crystal-development/SkiaBuild/include/core',
        '-Xcxx',
        '-I/crystal-development/SkiaBuild/include/docs',
        '-Xcxx',
        '-I/crystal-development/SkiaBuild/include/effects',
        '-Xcxx',
        '-I/crystal-development/SkiaBuild/include/encode',
        '-Xcxx',
        '-I/crystal-development/SkiaBuild/include/gpu',
        '-Xcxx',
        '-I/crystal-development/SkiaBuild/include/pathops',
        '-Xcxx',
        '-I/crystal-development/SkiaBuild/include/ports',
        '-Xcxx',
        '-I/crystal-development/SkiaBuild/include/private',
        '-Xcxx',
        '-I/crystal-development/SkiaBuild/include/svg',
        '-Xcxx',
        '-I/crystal-development/SkiaBuild/include/utils',
        '-Xlinker',
        '/crystal-development/SkiaBuild/out/Static/libskia.a',
        '-Xlinker',
        '-lpthread',
        '-Xlinker',
        '-lpng'
      ],
      { stdio: 'inherit' }
    )
    buildProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function copyFrameRendererExecutableToHost({ buildServerContainerId }) {
  return new Promise(resolve => {
    console.log('copying frame renderer executable to host...')
    const copyProcess = Child.spawn(
      'docker',
      [
        'cp',
        `${buildServerContainerId}:/crystal-development/FrameRenderer/.build/x86_64-unknown-linux/debug/FrameRenderer`,
        './Temp'
      ],
      { stdio: 'inherit' }
    )
    copyProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function copyFrameRendererExecutableToFrameRendererContainer({
  frameRendererContainerId
}) {
  return new Promise(resolve => {
    console.log(
      'copying frame renderer executable to frame renderer container...'
    )
    const copyProcess = Child.spawn(
      'docker',
      [
        'cp',
        './Temp/FrameRenderer',
        `${frameRendererContainerId}:/crystal-frame-renderer/`
      ],
      { stdio: 'inherit' }
    )
    copyProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function stopActiveFrameRendererExecutable({ frameRendererContainerId }) {
  return new Promise(resolve => {
    console.log('stopping active frame renderer executable...')
    const stopProcess = Child.spawn(
      'docker',
      ['exec', frameRendererContainerId, 'pkill', '-f', 'FrameRenderer'],
      { stdio: 'inherit' }
    )
    stopProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function startNewFrameRendererExecutable({ frameRendererContainerId }) {
  return new Promise(resolve => {
    console.log('starting new frame renderer executable...')
    console.log('')
    Child.spawn(
      'docker',
      ['exec', frameRendererContainerId, './FrameRenderer'],
      { stdio: 'inherit' }
    )
    resolve()
  })
}

function* coreSourceProcessor({ coreContainerId }) {
  const { sourceChangeChannel } = yield call(initSourceChangeWatcher, {
    sourceDirectoriesList: ['../ServiceCore/Sources']
  })
  while (true) {
    const changeMessage = yield take(sourceChangeChannel)
    switch (changeMessage.type) {
      case SourceChangeMessageType.UPDATED:
        const { updatedFilePath } = changeMessage.payload
        yield call(copySourceFileToCoreContainer, {
          coreContainerId,
          updatedFilePath
        })
        yield call(updateCoreScript, { coreContainerId })
        continue
      case SourceChangeMessageType.REMOVED:
        const { removedFilePath } = changeMessage.payload
        yield call(removeSourceFileFromCoreContainer, {
          coreContainerId,
          removedFilePath
        })
        yield call(updateCoreScript, { coreContainerId })
        continue
    }
  }
}

function copySourceFileToCoreContainer({ coreContainerId, updatedFilePath }) {
  return new Promise(resolve => {
    const relativeCoreContainerTargetPath = updatedFilePath.substring(15)
    console.log('copying updated source file to core container...')
    const transferProcess = Child.spawn(
      'docker',
      [
        'cp',
        updatedFilePath,
        `${coreContainerId}:/crystal-service-core/${relativeCoreContainerTargetPath}`
      ],
      { stdio: 'inherit' }
    )
    transferProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function removeSourceFileFromCoreContainer({
  coreContainerId,
  removedFilePath
}) {
  return new Promise(resolve => {
    const relativeCoreContainerTargetPath = removedFilePath.substring(15)
    console.log('removing source file from core container...')
    const removeProcess = Child.spawn(
      'docker',
      [
        'exec',
        coreContainerId,
        'rm',
        '-f',
        `/crystal-service-core/${relativeCoreContainerTargetPath}`
      ],
      { stdio: 'inherit' }
    )
    removeProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function* frameRendererSourceProcessor({
  buildServerContainerId,
  frameRendererContainerId
}) {
  const { sourceChangeChannel } = yield call(initSourceChangeWatcher, {
    sourceDirectoriesList: [
      '../FrameRenderer/Sources',
      '../FrameInterface/Sources',
      '../Skia/Sources'
    ]
  })
  while (true) {
    const changeMessage = yield take(sourceChangeChannel)
    switch (changeMessage.type) {
      case SourceChangeMessageType.UPDATED:
        const { updatedFilePath } = changeMessage.payload
        const frameInterfaceSource = FRAME_INTERFACE_PATTERN.test(
          updatedFilePath
        )
        if (frameInterfaceSource) {
          yield call(copySourceFileToFrameRenderer, {
            frameRendererContainerId,
            updatedFilePath
          })
        }
        yield call(copySourceFileToBuildServer, {
          buildServerContainerId,
          updatedFilePath
        })
        yield call(updateFrameRendererExecutable, {
          buildServerContainerId,
          frameRendererContainerId
        })
        continue
      case SourceChangeMessageType.REMOVED:
        const { removedFilePath } = changeMessage.payload
        if (FRAME_INTERFACE_PATTERN.test(removedFilePath)) {
          yield call(removeSourceFileOnFrameRenderer, {
            frameRendererContainerId,
            removedFilePath
          })
        }
        yield call(removeSourceFileOnBuildServer, {
          buildServerContainerId,
          removedFilePath
        })
        yield call(updateFrameRendererExecutable, {
          buildServerContainerId,
          frameRendererContainerId
        })
        continue
    }
  }
}

function copySourceFileToFrameRenderer({
  frameRendererContainerId,
  updatedFilePath
}) {
  return new Promise(resolve => {
    const relativeFrameRendererTargetPath = updatedFilePath.substring(3)
    console.log('copying updated source file to frame renderer...')
    const transferProcess = Child.spawn(
      'docker',
      [
        'cp',
        updatedFilePath,
        `${frameRendererContainerId}:/crystal-frame-renderer/${relativeFrameRendererTargetPath}`
      ],
      { stdio: 'inherit' }
    )
    transferProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function removeSourceFileOnFrameRenderer({
  frameRendererContainerId,
  removedFilePath
}) {
  return new Promise(resolve => {
    const relativeFrameRendererTargetPath = removedFilePath.substring(3)
    console.log('removing source file on frame renderer...')
    const removeProcess = Child.spawn(
      'docker',
      [
        'exec',
        frameRendererContainerId,
        'rm',
        '-f',
        `/crystal-frame-renderer/${relativeFrameRendererTargetPath}`
      ],
      { stdio: 'inherit' }
    )
    removeProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function copySourceFileToBuildServer({
  buildServerContainerId,
  updatedFilePath
}) {
  return new Promise(resolve => {
    const relativeBuildServerTargetPath = updatedFilePath.substring(3)
    console.log('copying updated source file to build server...')
    const transferProcess = Child.spawn(
      'docker',
      [
        'cp',
        updatedFilePath,
        `${buildServerContainerId}:/crystal-development/${relativeBuildServerTargetPath}`
      ],
      { stdio: 'inherit' }
    )
    transferProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function removeSourceFileOnBuildServer({
  buildServerContainerId,
  removedFilePath
}) {
  return new Promise(resolve => {
    const relativeBuildServerTargetPath = removedFilePath.substring(3)
    console.log('removing source file to build server...')
    const removeProcess = Child.spawn(
      'docker',
      [
        'exec',
        buildServerContainerId,
        'rm',
        '-f',
        `/crystal-development/${relativeBuildServerTargetPath}`
      ],
      { stdio: 'inherit' }
    )
    removeProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function initSourceChangeWatcher({ sourceDirectoriesList }) {
  return new Promise(resolve => {
    const sourceChangeChannel = eventChannel(emitMessage => {
      createFileWatcher(
        sourceDirectoriesList,
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
