/* eslint-disable no-undef */

export const realtimeReflections = () => {
  let renderer_ = null
  const camTexture_ = new THREE.Texture()

  const renderTarget = new THREE.WebGLCubeRenderTarget(256, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    encoding: THREE.sRGBEncoding,
  })

  const refMat = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: 0xffffff,
    map: camTexture_,
  })

  // cubemap scene
  const cubeMapScene = new THREE.Scene()
  const cubeCamera = new THREE.CubeCamera(1, 1000, renderTarget)
  const sphere = new THREE.SphereGeometry(100, 15, 15)
  const sphereMesh = new THREE.Mesh(sphere, refMat)
  sphereMesh.scale.set(-1, 1, 1)
  sphereMesh.rotation.set(Math.PI, -Math.PI / 2, 0)
  cubeMapScene.add(sphereMesh)

  // Populates a cube into an XR scene and sets the initial camera position.
  const initXrScene = ({ scene, camera, renderer }) => {
    // Enable shadows in the renderer.
    renderer.shadowMap.enabled = true
    renderer.outputEncoding = THREE.sRGBEncoding
  }

  // Return a camera pipeline module that returns a renderer
  return {
    name: 'realtimereflection',

    // TODO: THIS NEEDS TO BE AN UPDATE. OR
    onStart: ({ canvas }) => {
      const { scene, camera, renderer } = XR8.Threejs.xrScene()  // Get the 3js scene from XR8.Threejs

      // TODO: Instead of doing this maybe return an instance of cubeCamera, or cubeCamera.renderTarget.texture
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          console.log(object);
          object.material.envMap = cubeCamera.renderTarget.texture
          object.castShadow = true
        }
      });

      window.cubeCamera = cubeCamera
      renderer_ = renderer
      initXrScene({ scene, camera, renderer })  // Add objects set the starting camera position.
      // Sync the xr controller's 6DoF position and camera paremeters with our scene.
    },
    onUpdate: () => {
      const { scene, camera, renderer } = XR8.Threejs.xrScene()
      window.cubeCamera.update(renderer, cubeMapScene)
    },
    onProcessCpu: ({frameStartResult}) => {
      const {cameraTexture} = frameStartResult

      // refresh teh textures
      const {scene, camera, renderer} = XR8.Threejs.xrScene()  // Get the 3js scene from XR8.Threejs
      const texProps = renderer.properties.get(camTexture_)
      texProps.__webglTexture = cameraTexture
    },
  }
}