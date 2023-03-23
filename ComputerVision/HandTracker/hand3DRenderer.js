/**
 * This class uses googles mediapipe hand tracking data to render a hand in 3d position,
 * the tracking is done in the MediaPipeModule class.
 * for index references check https://developers.google.com/mediapipe/solutions/vision/hand_landmarker/index#models
 * */


// Hands from https://www.patreon.com/posts/free-oculus-vr-46544401
// hand3D = window.AssetLoader.getModel('hand-r').media.scene.children[0]


import * as THREE from 'three'
// import { ONHANDLOST } from '../../util/constants';
import Debugger from '../../util/Debugger';
import Detect from '../../util/Detect';
import Emitter from '../../util/Emitter';


// let hand3D;
// let handBones = [];
// let this.fingerBodiesMeshes = [];

let handRenderControl = {isFingerVisible: true, isFingerBodyVisible: true};


class Hand3DRenderer {
  constructor() {
    this.hand3D = null // !Not being used yet, used for rigged hand
    this.handBones = [] // !Not being used yet, used for rigged hand

    this.normalizedHandPoints = [];
    this.fingerNodeMeshes = [];
    this.fingerBodiesMeshes = []
    this.isInitialized = false;
    this.indexFingerScreenPosition = null;
    this.indexFingerMesh = null;
    this.palmNode = null

    this.deviceType = Detect.isIOS ? "ios" : "android";

    this.handVars = {
      "ios": {
        bubbleSize: 0.1,
        fingerRadious: 0.03,
        palmSize: 0.08,
        fingerLength: 0.06
      },
      "android": {
        bubbleSize: 0.1,
        fingerRadious: 0.03,
        palmSize: 0.08,
        fingerLength: 0.06
      }
    }

  }


  init = (scene, camera, mediaPipeHandPoints) => {
    if (!this.isInitialized) {
      this.scene = scene;
      this.camera = camera;
      //Initialize materials and geometries.
      console.log(this.deviceType);
      console.log(this.handVars[this.deviceType]);
      this.fingerBodyGeometry = new THREE.CylinderGeometry(this.handVars[this.deviceType].fingerRadious, this.handVars[this.deviceType].fingerRadious, this.handVars[this.deviceType].fingerLength, 32, 1);
      this.palmOcclusionGeometry = new THREE.SphereGeometry(this.handVars[this.deviceType].palmSize);
      this.occluderFingerNodeGeometry = new THREE.SphereGeometry(this.handVars[this.deviceType].fingerRadious * 2);
      this.handOcclusionMaterial = new THREE.MeshStandardMaterial({ color: 'white', side: THREE.DoubleSide, colorWrite: true })
      // Initialize array of vectors and Meshes
      // this.onHandDetected(mediaPipeHandPoints)
      this.initHandVectors(mediaPipeHandPoints)
      this.init3DHandOccluderMeshes(this.scene, this.camera, this.normalizedHandPoints)
      this.isInitialized = true

      // Debug ui
      this.initDebug()
    }
  }

  initDebug = () =>{
    let ARhandFolder = Debugger.gui.addFolder('AR Hand');
    ARhandFolder.add(this.handOcclusionMaterial,'colorWrite');
    ARhandFolder.add(handRenderControl,'isFingerVisible');
    ARhandFolder.add(handRenderControl,'isFingerBodyVisible');
  }

  initHandVectors = (mediaPipeData) => {
    for (let i = 0; i < mediaPipeData.hand.length; i++) {
      const fingerPoint = mediaPipeData.hand[i];
      const worldPosFinger = this.normalizeScreenPosition(fingerPoint)
      this.normalizedHandPoints.push(worldPosFinger)

      if (i == 8) {
        this.indexFingerScreenPosition = worldPosFinger;
        // console.log("===========");
        // console.log(mediaPipeData.hand[i])
        // console.log(this.normalizedHandPoints[i])
      }
    }
  }

  onHandDetected = (mediaPipeData) => {
    for (let i = 0; i < mediaPipeData.hand.length; i++) {
      const fingerPoint = mediaPipeData.hand[i];
      const worldPosFinger = this.normalizeScreenPosition(fingerPoint)
      this.normalizedHandPoints[i] = worldPosFinger;

      if (i == 8) {
        this.indexFingerScreenPosition = worldPosFinger;
        // console.log("===========");
        // console.log(mediaPipeData.hand[i])
        // console.log(this.normalizedHandPoints[i])
      }
    }
  }

  onHandLost = () => {
    if (this.fingerNodeMeshes[0]) {
      this.palmNode.visible = false
      if (this.fingerNodeMeshes[0].visible) {
        for (let i = 0; i < this.fingerNodeMeshes.length; i++) {
          this.fingerNodeMeshes[i].visible = false;
          if (this.fingerBodiesMeshes[i]) this.fingerBodiesMeshes[i].visible = false;
        }
      }
    }
  }


  // return an objet {nx (-1 to 1), ny (-1 to 1), z (nochange)}
  normalizeScreenPosition = (point) => {
    const nx = (point.x) * 2 - 1
    const ny = - (point.y) * 2 + 1
    const z = point.z

    return { nx, ny, z }
  }

  init3DHandOccluderMeshes = (scene, camera, handPoints) => {
    // TODO: Fix hand rotation and use a better mesh.
    // Initialize fingersNodes
    for (let i = 0; i < handPoints.length; i++) {
      let handPoint = new THREE.Mesh(this.occluderFingerNodeGeometry, this.handOcclusionMaterial)
      handPoint.renderOrder = 0;
      scene.add(handPoint)

      //get 3d world projection
      let posVector = new THREE.Vector3(handPoints[i].nx, handPoints[i].ny, - 1).unproject(camera);
      const dir = posVector.sub(camera.position).normalize();

      // distance from camera to point on the plane
      const distance = (camera.position.z - 1) / dir.z;
      // const distance = (camera.position.z - (0.5+(handPoints[i].z*0.01))) / dir.z;

      const finalPos = camera.position.clone().add(dir.multiplyScalar(distance));

      handPoint.position.copy(finalPos);

      if (i == 9) {
        this.indexFingerMesh = handPoint
        // handPoint.scale.setScalar(2)
      }
      handPoint.updateMatrix();  // this line seems unnecessary
      this.fingerNodeMeshes.push(handPoint)
    }

    this.initFingersBodies(scene);
  }

  initFingersBodies = (scene) => {
    for (let i = 0; i < this.fingerNodeMeshes.length; i++) {
      const currentFingerNode = this.fingerNodeMeshes[i];
      const nextFingerNode = this.fingerNodeMeshes[i + 1];

      if (nextFingerNode) {

        // init palm mesh
        if (i == 0) {
          this.palmNode = new THREE.Mesh(this.palmOcclusionGeometry, this.handOcclusionMaterial)
          this.palmNode.renderOrder = 0;

          scene.add(this.palmNode)
          this.palmNode.position.lerpVectors(currentFingerNode.position, this.fingerNodeMeshes[9].position, 0.5)
        }

        //init finger body mesh
        let fingerBody = new THREE.Mesh( this.fingerBodyGeometry, this.handOcclusionMaterial)
        fingerBody.renderOrder = 0;
        scene.add(fingerBody)

        fingerBody.position.lerpVectors(currentFingerNode.position, nextFingerNode.position, 0.5)
        this.fingerBodiesMeshes.push(fingerBody)
      }
    }
  }

  updateFindersBodies = (i) => {
    const currentFingerNode = this.fingerNodeMeshes[i];
    const nextFingerNode = this.fingerNodeMeshes[i + 1];

    // TODO: Calculate rotation
    if (nextFingerNode) {
      this.fingerBodiesMeshes[i].visible = handRenderControl.isFingerBodyVisible
      this.palmNode.visible = true
      if (i == 0) {
        this.palmNode.position.lerpVectors(currentFingerNode.position, this.fingerNodeMeshes[9].position, 0.5)
        var dir = new THREE.Vector3(); // create once an reuse it
        // dir.subVectors( currentFingerNode.position , this.fingerNodeMeshes[9].position).normalize();
        // this.palmNode.lookAt(dir)

      }
      if ((i % 4 != 0)) {
        let dir = new THREE.Vector3(); // create once an reuse it
        dir.subVectors(nextFingerNode.position, currentFingerNode.position).normalize();

        this.fingerBodiesMeshes[i].position.lerpVectors(currentFingerNode.position, nextFingerNode.position, 0.5)
        this.fingerBodiesMeshes[i].lookAt(dir)

        // this.fingerBodiesMeshes[i].rotateX(-Math.PI/4)
        // this.fingerBodiesMeshes[i].rotateY(-Math.PI/4)
        // this.fingerBodiesMeshes[i].rotateZ(-Math.PI/4)
      } else {
        this.fingerBodiesMeshes[i].visible = false
      }
    }
  }

  update3DHandOccluderPoints = (camera) => {
    for (let i = 0; i < this.fingerNodeMeshes.length; i++) {
      if (this.normalizedHandPoints.length > 0 && this.fingerNodeMeshes.length > 0) {

        const normalizePos = this.normalizedHandPoints[i];
        let posVector = new THREE.Vector3(normalizePos.nx, normalizePos.ny, -1).unproject(camera);
        const dir = posVector.sub(camera.position).normalize();

        // distance from camera to point on the plane
        const distance = (camera.position.z - 1) / dir.z;
        // const distance = (camera.position.z - (0.5+(normalizePos.z*0.01))) / dir.z;
        const finalPos = camera.position.clone().add(dir.multiplyScalar(distance));

        // if (!window.printOnce) {
        //   console.log(finalPos);
        // }

        this.fingerNodeMeshes[i].visible = handRenderControl.isFingerVisible;
        this.fingerNodeMeshes[i].position.copy(finalPos);

        // updateHandBones(i,finalPos)
        this.updateFindersBodies(i)
        this.fingerNodeMeshes[i].updateMatrix();  // this line seems unnecessary
      }
    }
    window.printOnce = true
  }

  //---- wip for using a rigged mesh ---//
  getHandMap = () =>{
    return [
        'Bone000', //whrist
        'Bone001', //thum_0
        'Bone002', //thum_1
        'Bone003', //thum_2
        'tip', //thum_3

        'Bone004', //index_0
        'Bone005', //index_1
        'Bone006', //index_2
        'tip', //index_3

        'Bone007', //middle_0
        'Bone008', //middle_1
        'Bone009', //middle_2
        'tip', //middle_3

        'Bone010', //ring_0
        'Bone011', //ring_1
        'Bone012', //ring_2
        'tip', //ring_3

        'Bone013', //pinky_0
        'Bone014', //pinky_1
        'Bone015', //pinky_2
        'tip', //pinky_3

        'Bone001', //whrist pinky
    ]
  }
  // 3D rigged Hand Model
  setHandBones = () => {
    let handNames = this.getHandMap()
    for (let index = 0; index < handNames.length; index++) {
      const name = handNames[index];
      const temp = this.hand3D.getObjectByName(name);
      this.handBones.push(temp)
    }
  }

  updateHandBones = (boneIndex, position) => {
    if (this.handBones[boneIndex]) this.handBones[boneIndex].position.copy(position)

  }

}

export default Hand3DRenderer;