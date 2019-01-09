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
  const { buildServerContainerId } = yield call(initBuildServerContainer)
  const { serviceContainerId } = yield call(initServiceContainer)
  yield call(updateServiceExecutable, {
    buildServerContainerId,
    serviceContainerId
  })
  yield spawn(serviceProcessor, {
    buildServerContainerId,
    serviceContainerId
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

function makeTempDirectory() {
  return new Promise(resolve => {
    console.log('making Temp directory...')
    console.log('')
    Child.exec('mkdir -p Temp', (makeError, makeOutput) => {
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
        resolve({ buildServerContainerId })
      }
    )
  })
}

function* initServiceContainer() {
  yield call(buildServiceImage)
  const { serviceContainerId } = yield call(startServiceContainer)
  return { serviceContainerId }
}

function buildServiceImage() {
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

function startServiceContainer() {
  return new Promise(resolve => {
    console.log('starting crystal-service container...')
    Child.exec(
      'docker run -t -i -d -p 8181:8181 crystal-service',
      (startError, containerId) => {
        if (startError) throw startError
        const serviceContainerId = containerId.substring(0, 12)
        console.log(`---> ${serviceContainerId}`)
        console.log('')
        resolve({ serviceContainerId })
      }
    )
  })
}

function* updateServiceExecutable({
  buildServerContainerId,
  serviceContainerId
}) {
  yield call(buildServiceExecutable, { buildServerContainerId })
  yield call(copyServiceExecutableToHost, { buildServerContainerId })
  yield call(copyServiceExecutableToServiceContainer, { serviceContainerId })
  yield call(stopActiveServiceExecutable, { serviceContainerId })
  yield call(startNewServiceExecutable, { serviceContainerId })
}

function buildServiceExecutable({ buildServerContainerId }) {
  return new Promise(resolve => {
    console.log('buidling service executable...')
    const buildProcess = Child.spawn(
      'docker',
      [
        'exec',
        buildServerContainerId,
        'swift',
        'build',
        '--package-path',
        './Service',
        '-Xcxx',
        '-std=c++11',
        '-Xcxx',
        '-I/CrystalDevelopment/SkiaBuild/include/c',
        '-Xcxx',
        '-I/CrystalDevelopment/SkiaBuild/include/codec',
        '-Xcxx',
        '-I/CrystalDevelopment/SkiaBuild/include/config',
        '-Xcxx',
        '-I/CrystalDevelopment/SkiaBuild/include/core',
        '-Xcxx',
        '-I/CrystalDevelopment/SkiaBuild/include/docs',
        '-Xcxx',
        '-I/CrystalDevelopment/SkiaBuild/include/effects',
        '-Xcxx',
        '-I/CrystalDevelopment/SkiaBuild/include/encode',
        '-Xcxx',
        '-I/CrystalDevelopment/SkiaBuild/include/gpu',
        '-Xcxx',
        '-I/CrystalDevelopment/SkiaBuild/include/pathops',
        '-Xcxx',
        '-I/CrystalDevelopment/SkiaBuild/include/ports',
        '-Xcxx',
        '-I/CrystalDevelopment/SkiaBuild/include/private',
        '-Xcxx',
        '-I/CrystalDevelopment/SkiaBuild/include/svg',
        '-Xcxx',
        '-I/CrystalDevelopment/SkiaBuild/include/utils',
        '-Xlinker',
        '/CrystalDevelopment/SkiaBuild/out/Static/libskia.a',
        '-Xlinker',
        '-lpthread',
        '-Xlinker',
        '-lpng'
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

function copyServiceExecutableToHost({ buildServerContainerId }) {
  return new Promise(resolve => {
    console.log('copying service executable to host...')
    const copyProcess = Child.spawn(
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
    copyProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function copyServiceExecutableToServiceContainer({ serviceContainerId }) {
  return new Promise(resolve => {
    console.log('copying service executable to service container...')
    const copyProcess = Child.spawn(
      'docker',
      ['cp', './Temp/CrystalService', `${serviceContainerId}:/Crystal/`],
      {
        stdio: 'inherit'
      }
    )
    copyProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function stopActiveServiceExecutable({ serviceContainerId }) {
  return new Promise(resolve => {
    console.log('stopping active service executable...')
    const stopProcess = Child.spawn(
      'docker',
      ['exec', serviceContainerId, 'pkill', '-f', 'CrystalService'],
      {
        stdio: 'inherit'
      }
    )
    stopProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function startNewServiceExecutable({ serviceContainerId }) {
  return new Promise(resolve => {
    console.log('starting new service executable...')
    console.log('')
    Child.spawn('docker', ['exec', serviceContainerId, './CrystalService'], {
      stdio: 'inherit'
    })
    resolve()
  })
}

function* serviceProcessor({ buildServerContainerId, serviceContainerId }) {
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
        yield call(updateServiceExecutable, {
          buildServerContainerId,
          serviceContainerId
        })
        continue
      case SourceChangeMessageType.REMOVED:
        const { removedFilePath } = changeMessage.payload
        yield call(removeSourceFileOnBuildServer, {
          buildServerContainerId,
          removedFilePath
        })
        yield call(updateServiceExecutable, {
          buildServerContainerId,
          serviceContainerId
        })
        continue
    }
  }
}

function initSourceChangeWatcher() {
  return new Promise(resolve => {
    const sourceChangeChannel = eventChannel(emitMessage => {
      createFileWatcher(
        ['../Service/Sources', '../SkiaLib/Sources', '../Skia/Sources'],
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
