const Child = require('child_process')
const createSagaCore = require('create-saga-core')
const { call } = require('redux-saga/effects')

const CRYSTAL_VERSION = '0.1.0'
const FRAME_RENDERER_IMAGE_ID = `layeredcycles/crystal-frame-renderer:${CRYSTAL_VERSION}`
const SERVICE_CORE_IMAGE_ID = `layeredcycles/crystal-service-core:${CRYSTAL_VERSION}`

createSagaCore({ initializer })

function* initializer() {
  yield call(setupStageDirectory)
  yield call(createFrameRendererProductionImage)
  yield call(createServiceCoreProductionImage)
}

function* setupStageDirectory() {
  yield call(removeStaleStage)
  yield call(makeStageDirectory)
}

function removeStaleStage() {
  return new Promise(resolve => {
    console.log('removing stale stage...')
    console.log('')
    Child.exec('rm -rf ./Stage', removeError => {
      if (removeError) throw removeError
      resolve()
    })
  })
}

function makeStageDirectory() {
  return new Promise(resolve => {
    console.log('making stage directory...')
    console.log('')
    Child.exec('mkdir -p Stage', makeError => {
      if (makeError) throw makeError
      resolve()
    })
  })
}

function* createFrameRendererProductionImage() {
  yield call(buildCompileFrameRendererImage)
  const { compileFrameRendererContainerId } = yield call(
    runCompileFrameRendererContainer
  )
  yield call(copyFrameRendererExecutableToStage, {
    compileFrameRendererContainerId
  })
  yield call(buildFrameRendererImage)
  yield call(pushFrameRendererImage)
}

function buildCompileFrameRendererImage() {
  return new Promise(resolve => {
    console.log('building crystal-compile-frame-renderer image...')
    const buildProcess = Child.spawn(
      'docker',
      [
        'build',
        '--tag',
        'crystal-compile-frame-renderer',
        '--file',
        './CompileFrameRenderer.Dockerfile',
        '../'
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

function runCompileFrameRendererContainer() {
  return new Promise(resolve => {
    console.log('running crystal-compile-frame-renderer container...')
    console.log('')
    Child.exec(
      'docker run -itd crystal-compile-frame-renderer',
      (runError, containerId) => {
        if (runError) throw runError
        const compileFrameRendererContainerId = containerId.substring(0, 12)
        console.log(`---> ${compileFrameRendererContainerId}`)
        console.log('')
        process.on('exit', () =>
          Child.exec(`docker rm -f ${compileFrameRendererContainerId}`)
        )
        resolve({ compileFrameRendererContainerId })
      }
    )
  })
}

function copyFrameRendererExecutableToStage({
  compileFrameRendererContainerId
}) {
  return new Promise(resolve => {
    console.log('copying frame renderer executable to stage...')
    const copyProcess = Child.spawn(
      'docker',
      [
        'cp',
        `${compileFrameRendererContainerId}:/compile-frame-renderer/FrameRenderer/.build/x86_64-unknown-linux/release/FrameRenderer`,
        './Stage'
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

function buildFrameRendererImage() {
  return new Promise(resolve => {
    console.log(`building ${FRAME_RENDERER_IMAGE_ID} image...`)
    const buildProcess = Child.spawn(
      'docker',
      [
        'build',
        '--tag',
        FRAME_RENDERER_IMAGE_ID,
        '--file',
        './FrameRenderer.Dockerfile',
        '../'
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

function pushFrameRendererImage() {
  return new Promise(resolve => {
    console.log(`pushing ${FRAME_RENDERER_IMAGE_ID}...`)
    const pushProcess = Child.spawn(
      'docker',
      ['push', FRAME_RENDERER_IMAGE_ID],
      {
        stdio: 'inherit'
      }
    )
    pushProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}

function* createServiceCoreProductionImage() {
  yield call(buildServiceCoreImage)
  yield call(pushServiceCoreImage)
}

function buildServiceCoreImage() {
  return new Promise(resolve => {
    console.log(`building ${SERVICE_CORE_IMAGE_ID} image...`)
    const buildProcess = Child.spawn(
      'docker',
      [
        'build',
        '--tag',
        SERVICE_CORE_IMAGE_ID,
        '--file',
        './ServiceCore.Dockerfile',
        '../'
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

function pushServiceCoreImage() {
  return new Promise(resolve => {
    console.log(`pushing ${SERVICE_CORE_IMAGE_ID}...`)
    const pushProcess = Child.spawn('docker', ['push', SERVICE_CORE_IMAGE_ID], {
      stdio: 'inherit'
    })
    pushProcess.on('close', () => {
      console.log('')
      resolve()
    })
  })
}
