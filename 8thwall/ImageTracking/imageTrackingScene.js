// import Postprocessing from './Postprocessing'
// import {autobind} from "core-decorators";
// import {ONASSETSLOADED, ONMARKERFOUND, ONPLAYERREADY, ONSTART} from "../core/constants";
import Emitter from "../util/Emitter";
import Global from "../util/Global";
import * as THREE from 'three'

const imageTrackingScene = () => {
    let cube;
    const initXrScene = (stage3D) => {
        const { scene, camera, content } = stage3D;

        cube = new THREE.Mesh(new THREE.BoxBufferGeometry(1,1,1), new THREE.MeshBasicMaterial({color: 'red', side:THREE.DoubleSide}))
        cube.visible = false;

        scene.add(cube);

        camera.position.set(0, 3, 0)
    }

    // Places content over image target
    const showTarget = ({ detail }) => {

        //AR MARKER
        // specify name with === "custom_name"
        if (detail.name) {
            cube.position.copy(detail.position)
            cube.quaternion.copy(detail.rotation)
            cube.scale.set(detail.scale, detail.scale, detail.scale)

            if(!cube.visible){
                console.log("first time found");
                cube.visible = true
            }

            // Emitter.emit("marker_found", detail.name);
        }
    }

    // May need to aply an offset
    const applyTracker = (target, detail) => {
        // target.position.copy(detail.position).addScaledVector(offsets.position, detail.scale)
        // target.quaternion.copy(detail.rotation);

        //Force the experience to ignore the market rotation and make it look at the user.
        // const temp_cam = new Vector3().copy(scope.camera.position);
        // temp_cam.y = target.position.y
        // target.lookAt(temp_cam)

        // target.scale.setScalar(detail.scale).multiply(offsets.scale);
    }

    // Hides the image frame when the target is no longer detected.
    const hideTarget = ({ detail }) => {
        // if (detail.name === 'coke_zs_325ml_flat' || detail.name === 'test-marker') {
        if (detail.name) {
            cube.position.copy(detail.position)
            cube.quaternion.copy(detail.rotation)
            cube.scale.set(detail.scale, detail.scale, detail.scale)
            if(cube.visible){
                console.log("first time lost");
            }
            cube.visible = false
            // Emitter.emit("marker_lost", detail.name);
        }
    }

    // Grab a handle to the threejs scene and set the camera position on pipeline startup.
    const onStart = ({ canvas, GLctx }) => {
        console.log('onstart',window.XR8.Threejs.xrScene());
        const stage3D = window.XR8.Threejs.xrScene();
        const { scene, camera, renderer } = stage3D  // Get the 3js scene from XR8.Threejs

        //TODO: NOT HERE MOVE TO SCENE OR LOADER OR PIPELINE MODULE
        initXrScene(stage3D)  // Add content to the scene and set starting camera position.

        // prevent scroll/pinch gestures on canvas
        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault()
        })

        // Sync the xr controller's 6DoF position and camera paremeters with our scene.
        window.XR8.XrController.updateCameraProjectionMatrix({
            origin: camera.position,
            facing: camera.quaternion,
        })
    }

    const onRender = () => {
        const stage3D = window.XR8.Threejs.xrScene();
        // !Lets check if this is duplicated or not, seams to be.
        // stage3D.renderer.clearDepth();
        // stage3D.render();
    }

    return {
        // Camera pipeline modules need a name. It can be whatever you want but must be
        // unique within your app.
        name: 'tool-image-tracking-scene',

        // onStart is called once when the camera feed begins. In this case, we need to wait for the
        // XR8.Threejs scene to be ready before we can access it to add content. It was created in
        // XR8.Threejs.pipelineModule()'s onStart method.
        onStart,
        onRender,

        onCanvasSizeChange: ({ canvasWidth, canvasHeight }) => {
            const stage3D = window.XR8.Threejs.xrScene();
            stage3D.resize(canvasWidth, canvasHeight);
            stage3D.post?.composer?.setSize(canvasWidth, canvasHeight);
        },

        // Listeners are called right after the processing stage that fired them. This guarantees that
        // updates can be applied at an appropriate synchronized point in the rendering cycle.
        listeners: [
            { event: 'reality.imagefound', process: showTarget },
            { event: 'reality.imageupdated', process: showTarget },
            { event: 'reality.imagelost', process: hideTarget },
        ],
    }
}

export default WebARScene;