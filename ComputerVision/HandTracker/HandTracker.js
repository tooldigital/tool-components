/* eslint-disable no-undef */
/** This class handles the hand tracking using Googles MediaPipe,
 * https://developers.google.com/mediapipe/solutions/vision/hand_landmarker/web_js#model
 * finger indexes: https://developers.google.com/mediapipe/solutions/vision/hand_landmarker/index#models
 *
 * Check examples at https://codepen.io/mediapipe-preview/pen/gOKBGPN
 *
 *
*/

import { ONHANDTRACKED, ONHANDLOST, ONCANVASRESIZE } from "../util/constants";
import Emitter from "../../util/Emitter"; //custom event emitter
import handLandmarkModel from './hand_landmarker_model.task'
import vision from "@mediapipe/tasks-vision";
const { HandLandmarker, FilesetResolver } = vision;

class HandTracker {
    constructor(){
        this.found = false;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        this.arCanvas = null;
        this.isRunning = false;
        this.hands = null;
        this.userCamera = null;
        this.w = 0;
        this.h = 0;
    }

    onResults = (results) => {
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        // this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
        if (results.landmarks) {
            this.found = true;
            if (results.landmarks[0]) { // Check if there's a hand
                let hand = results.landmarks[0][9]
                // console.log(hand.x, hand.y)
                // this.canvasCtx.beginPath();
                // this.canvasCtx.arc(hand.x * this.canvasElement.width, hand.y * this.canvasElement.height, 50, 0, 2 * Math.PI);
                // this.canvasCtx.lineWidth = 5;
			    // this.canvasCtx.strokeStyle = '#00ff00';
                // this.canvasCtx.stroke();

                // let hand2 = results.landmarks[0][8]
                // // console.log(hand2.x, hand2.y)
                // this.canvasCtx.beginPath();
                // this.canvasCtx.arc(hand2.x * this.canvasElement.width, hand2.y * this.canvasElement.height, 30, 0, 2 * Math.PI);
                // this.canvasCtx.lineWidth = 5;
			    // this.canvasCtx.strokeStyle = '#ff0000';
                // this.canvasCtx.stroke();

                Emitter.emit(ONHANDTRACKED,{hand: results.landmarks[0]});
            }

            if(Global.handDebug){
                for (const landmarks of results.landmarks) {
                    drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
                    drawLandmarks(this.canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});
                }
            }
        }else{
            if(this.found){
                Emitter.emit(ONHANDLOST);
                this.found = false
            }
        }

        this.canvasCtx.restore();
    }

    createAndAppendElement = (type, elementID) => {
        const TEMP_ELEMENT = document.createElement(type);
        if(elementID) TEMP_ELEMENT.setAttribute('id', elementID);

        document.documentElement.append(TEMP_ELEMENT);
        return TEMP_ELEMENT;
    }

    assignHTMLElements = () =>{
        this.arCanvas = document.getElementById('camerafeed')
        this.videoElement = document.getElementsByTagName('video')[0] || this.createAndAppendElement('video', 'cameraVideoStream')
        this.canvasElement = document.getElementById('handtracker') || this.createAndAppendElement('canvas', 'handtracker')
    }

    resizeCanvas(width,height) {
        this.w = width || this.arCanvas.getAttribute('width') || window.screen.width;
        this.h = height || this.arCanvas.getAttribute('height') || window.screen.height;

        // console.log(this.w, this.h); //668, 1280

        this.canvasElement.width = this.w;
        this.canvasElement.height = this.h;
    }

    init = async (autoStart) =>{
        if(!this.isRunning){
            this.isRunning = true

            this.assignHTMLElements();
            this.resizeCanvas();

            this.vision = await FilesetResolver.forVisionTasks(
                // path/to/wasm/root
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            this.handLandmarker = await HandLandmarker.createFromOptions(
                this.vision,
                {
                    baseOptions: {
                    modelAssetPath: handLandmarkModel
                    },
                    numHands: 1
                });

            await this.handLandmarker.setOptions({ runningMode: "video" });
            this.lastVideoTime = -1;

            console.log(this.canvasElement);
            this.canvasCtx = this.canvasElement.getContext('2d');

            // this.initHandTrackingObjects();
            // this.initCamera();
            if(autoStart){
                this.doDetection();
            }

            Emitter.on(ONCANVASRESIZE, (data)=>{
                this.resizeCanvas(data.canvasWidth, data.canvasHeight)
            })
        }
    }

    doDetection = () =>{
        // const video = document.getElementById("video");
        if (this.videoElement.currentTime !== this.lastVideoTime) {
            let nowInMs = Date.now();
          const detections = this.handLandmarker.detectForVideo(this.videoElement, nowInMs);
          this.onResults(detections);
          this.lastVideoTime = this.videoElement.currentTime;
        }

        requestAnimationFrame(() => {
            this.doDetection();
        });
        // this.userCamera.start()
    }


    initCamera() {
        this.userCamera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.hands.send({ image: this.videoElement });
            },

            facingMode: 'environment'
        });
        console.log('this.userCamera', this.userCamera);
    }

    enableCam(event) {
        if (!this.handLandmarker) {
          console.log("Wait! objectDetector not loaded yet.");
          return;
        }

        // getUsermedia parameters.
        const constraints = {
          video: true
        };

        // Activate the webcam stream.
        navigator.mediaDevices.getUserMedia(constraints).then( (stream) => {
          this.videoElement.srcObject = stream;
          this.videoElement.addEventListener("loadeddata", doDetection);
        });
      }
}

export default new HandTracker();