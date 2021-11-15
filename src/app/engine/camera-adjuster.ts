import { PerspectiveCamera, Vector3, Object3D, Box3 } from "three";
import { OffscreenOrbitControls } from "../offscreen-orbit-controls/offscreen-orbit-controls";
import { Animations, Keyframe, Keyframes } from "./page-transitions";
import { Tweens } from "./tweens";



export class CameraAdjuster {


    private controlsCamera: PerspectiveCamera;
    private isSkinsFocusWide: boolean;


    private cameraContainerInitPosition: Vector3;
    private focusBoxInitScale: Vector3;
    private focusBoxInitPosition: Vector3;

    private cameraSkinsInitWidePosition: Vector3;
    private cameraSkinsInitNarrowPosition: Vector3;



    constructor(
        private controls: OffscreenOrbitControls,
        private cameraContainer: Object3D,
        private focusBox: Object3D,
        private animations: Animations
    ) {
        this.controls.update();
        this.controls.saveState();
        this.controlsCamera = controls.object as PerspectiveCamera;
        this.controlsCamera.position.copy(cameraContainer.position);
 
        this.focusBoxInitScale = this.focusBox.scale.clone();
        this.focusBoxInitPosition = this.focusBox.position.clone();
        this.cameraContainerInitPosition = this.cameraContainer.position.clone();

    }


    adjustCamera( 
        keyframes: {
            focusKeyframe: Keyframe,
            cameraKeyframe: Keyframe
        }) {
 

        this.controlsCamera.position.copy(keyframes.cameraKeyframe.position);

        const tempFocusBox = this.focusBox.clone();
        tempFocusBox.position.copy(keyframes.focusKeyframe.position);
        tempFocusBox.scale.copy(keyframes.focusKeyframe.scale);
        tempFocusBox.quaternion.copy(keyframes.focusKeyframe.quaternion);

        this.fitCameraToObject(this.controlsCamera, tempFocusBox, 0, this.controls);
        const distance = keyframes.cameraKeyframe.position.distanceTo(this.controlsCamera.position);
        keyframes.cameraKeyframe.position.setZ(distance)
 
        return keyframes;

    }



    async adjustCameraToBoard(rows: number, cols: number): Promise<void> {

        this.controls.reset();
        await Tweens.transitVec3(this.cameraContainer.position, this.cameraContainerInitPosition.clone(), 1000);
        // this.controlsCamera.position.copy(this.cameraContainer.position); 

        const tempFocusBox = this.focusBox.clone();

        const scale = new Vector3(cols / 2 + 1, rows / 2 + 1.5, 3);
        const position = new Vector3(0, rows / 2 + 0.5, 0);

        tempFocusBox.position.copy(position);
        tempFocusBox.scale.copy(scale);


        this.fitCameraToObject(this.controlsCamera, tempFocusBox, 12, this.controls);

        this.controlsCamera.position.setY(rows / 2);

        // this.controls.update();

        await Promise.all([
            Tweens.transitVec3(this.focusBox.position, position, 1000),
            Tweens.transitVec3(this.focusBox.scale, scale, 1000),
            Tweens.transitVec3(this.cameraContainer.position, this.controlsCamera.position.clone(), 1000),
        ]);
    }


    async initializeCameraPositionAnimation() {

        const fposition = this.focusBoxInitPosition.clone();
        const fscale = this.focusBoxInitScale.clone();
        const cposition = this.cameraContainerInitPosition.clone();

        this.controlsCamera.position.copy(this.cameraContainerInitPosition);

        await Promise.all([
            Tweens.transitVec3(this.focusBox.position, fposition, 1000),
            Tweens.transitVec3(this.focusBox.scale, fscale, 1000),
            Tweens.transitVec3(this.cameraContainer.position, cposition, 1000),
        ]);

    }


    private fitCameraToObject(camera: PerspectiveCamera, object: Object3D, offset: number, controls: OffscreenOrbitControls) {

        // offset = offset || 1;

        const boundingBox = new Box3();

        // get bounding box of object - this will be used to setup controls and camera
        boundingBox.setFromObject(object);

        const center = boundingBox.getCenter(new Vector3());

        const size = boundingBox.getSize(new Vector3());

        // get the max side of the bounding box (fits to width OR height as needed )
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 4 * Math.tan(fov * 2));

        if (offset !== 0) {
            cameraZ *= offset; // zoom out a little so that objects don't fill the screen
        }

        camera.position.z = cameraZ;


        if (controls) {

            // set camera to rotate around center of loaded object
            controls.target = center;

            // prevent camera from zooming out far enough to create far plane cutoff
            // controls.maxDistance = cameraToFarEdge * 2;

            // controls.saveState();

        } else {

            camera.lookAt(center)

        }
    }




}