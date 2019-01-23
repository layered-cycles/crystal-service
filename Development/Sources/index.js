const Child = require('child_process')
const { eventChannel, buffers } = require('redux-saga')
const { call, spawn, take } = require('redux-saga/effects')
const createSagaCore = require('create-saga-core')
const createFileWatcher = require('node-watch')

const SourceChangeMessageType = {
  UPDATED: 'UPDATED__SOURCE_CHANGE_MESSAGE_TYPE',
  REMOVED: 'REMOVED__SOURCE_CHANGE_MESSAGE_TYPE'
}

createSagaCore({ initializer }).then(store => {})

function* initializer() {
  process.on('SIGINT', process.exit)
  const { buildServerContainerId } = yield call(initBuildServerContainer)
  const { frameRendererContainerId } = yield call(initServiceContainers)
  yield call(updateFrameRendererExecutable, {
    buildServerContainerId,
    frameRendererContainerId
  })
  yield spawn(sourceCodeProcessor, {
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
    console.log('building crystal-development image...')
    const buildProcess = Child.spawn(
      'docker',
      [
        'build',
        '-t',
        'crystal-development',
        '-f',
        '../Development.Dockerfile',
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
      'docker run -t -i -d crystal-development',
      (startError, containerId) => {
        if (startError) throw startError
        const buildServerContainerId = containerId.substring(0, 12)
        console.log(`---> ${buildServerContainerId}`)
        console.log('')
        process.on('exit', () => {
          Child.exec(`docker rm -f ${buildServerContainerId}`)
        })
        resolve({ buildServerContainerId })
      }
    )
  })
}

function* initServiceContainers() {
  yield call(buildFrameRendererImage)
  yield call(composeServiceContainers)
  const { frameRendererContainerId } = yield call(fetchFrameRendererContainerId)
  return { frameRendererContainerId }
}

function buildFrameRendererImage() {
  return new Promise(resolve => {
    console.log('building crystal-frame-renderer image...')
    const buildProcess = Child.spawn(
      'docker',
      [
        'build',
        '-t',
        'crystal-frame-renderer',
        '-f',
        '../FrameRenderer.Dockerfile',
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

function composeServiceContainers() {
  return new Promise(resolve => {
    console.log('composing service containers...')
    const composeUpProcess = Child.spawn(
      'docker-compose',
      ['--file', '../docker-compose.yaml', 'up', '--detach'],
      { stdio: 'inherit' }
    )
    composeUpProcess.on('close', () => {
      console.log('')
      process.on('exit', () => {
        Child.spawn(
          'docker-compose',
          ['--file', '../docker-compose.yaml', 'down'],
          { stdio: 'inherit' }
        )
      })
      resolve()
    })
  })
}

function fetchFrameRendererContainerId() {
  console.log('fetching frame-renderer container id...')
  console.log('')
  return new Promise(resolve => {
    Child.exec(
      'docker-compose --file ../docker-compose.yaml ps --quiet frame-renderer',
      (fetchError, containerId) => {
        if (fetchError) throw fetchError
        const frameRendererContainerId = containerId.substring(0, 12)
        resolve({ frameRendererContainerId })
      }
    )
  })
}

function* updateFrameRendererExecutable({
  buildServerContainerId,
  frameRendererContainerId
}) {
  yield call(buildFrameRendererExecutable, { buildServerContainerId })
  yield call(copyFrameRendererExecutableToHost, { buildServerContainerId })
  yield call(copyDefaultFrameSchemaLibraryToHost, { buildServerContainerId })
  yield call(copyFrameRendererExecutableToFrameRendererContainer, {
    frameRendererContainerId
  })
  yield call(copyDefaultFrameSchemaLibraryToFrameRendererContainer, {
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

function copyDefaultFrameSchemaLibraryToHost({ buildServerContainerId }) {
  return new Promise(resolve => {
    console.log('copying default frame schema library to host...')
    const copyProcess = Child.spawn(
      'docker',
      [
        'cp',
        `${buildServerContainerId}:/crystal-development/FrameRenderer/.build/x86_64-unknown-linux/debug/libFrameSchema.so`,
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
        `${frameRendererContainerId}:/frame-renderer/`
      ],
      { stdio: 'inherit' }
    )
    copyProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function copyDefaultFrameSchemaLibraryToFrameRendererContainer({
  frameRendererContainerId
}) {
  return new Promise(resolve => {
    console.log(
      'copying default frame schema library to frame renderer container...'
    )
    const copyProcess = Child.spawn(
      'docker',
      [
        'cp',
        './Temp/libFrameSchema.so',
        `${frameRendererContainerId}:/frame-renderer/`
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

function* sourceCodeProcessor({
  buildServerContainerId,
  frameRendererContainerId
}) {
  const { sourceChangeChannel } = yield call(initSourceChangeWatcher)
  while (true) {
    const changeMessage = yield take(sourceChangeChannel)
    switch (changeMessage.type) {
      case SourceChangeMessageType.UPDATED:
        const { updatedFilePath } = changeMessage.payload
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

function initSourceChangeWatcher() {
  return new Promise(resolve => {
    const sourceChangeChannel = eventChannel(emitMessage => {
      createFileWatcher(
        [
          '../FrameRenderer/Sources',
          '../FrameInterface/Sources',
          '../DefaultFrameSchema/Sources',
          '../Skia/Sources'
        ],
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

function copySourceFileToBuildServer({
  buildServerContainerId,
  updatedFilePath
}) {
  return new Promise(resolve => {
    const relativeBuildServerTargetPath = updatedFilePath.substring(3)
    console.log('copying updated source file...')
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
    console.log('removing source file...')
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
