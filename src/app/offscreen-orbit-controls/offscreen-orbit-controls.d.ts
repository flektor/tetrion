import { Camera, Vector3, MOUSE, TOUCH } from "three";
 
export class OffscreenOrbitControls {

    constructor(object: Camera, domElement: HTMLElement, window: any);

    object: Camera;
    domElement: HTMLElement | HTMLDocument;

    // API
    enabled: boolean;
    target: Vector3;

    // deprecated
    center: Vector3;

    minDistance: number;
    maxDistance: number;

    minZoom: number;
    maxZoom: number;

    minPolarAngle: number;
    maxPolarAngle: number;

    minAzimuthAngle: number;
    maxAzimuthAngle: number;

    enableDamping: boolean;
    dampingFactor: number;

    enableZoom: boolean;
    zoomSpeed: number;

    enableRotate: boolean;
    rotateSpeed: number;

    enablePan: boolean;
    panSpeed: number;
    screenSpacePanning: boolean;
    keyPanSpeed: number;

    autoRotate: boolean;
    autoRotateSpeed: number;

    enableKeys: boolean;
    keys: { LEFT: number; UP: number; RIGHT: number; BOTTOM: number; };
    mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE; };
    touches: { ONE: TOUCH; TWO: TOUCH };

    update(): boolean;

    saveState(): void;

    reset(): void;

    dispose(): void;

    getPolarAngle(): number;

    getAzimuthalAngle(): number;

    // EventDispatcher mixins
    addEventListener(type: string, listener: (event: any) => void): void;

    hasEventListener(type: string, listener: (event: any) => void): boolean;

    removeEventListener(type: string, listener: (event: any) => void): void;

    dispatchEvent(event: { type: string; target: any; }): void;

}

export class MapControls extends OffscreenOrbitControls {

    constructor(object: Camera, domElement: HTMLElement, window: any);


}
 

export interface EventProps {
    clientX?: number;
    clientY?: number;
  
    deltaY?: number;
    keyCode?: number;
    preventDefault: () => void;
    stopPropagation: () => void;
  
    touches?: Array<{ pageX: number, pageY: number }>
  
    pointerType?: 'mouse' | 'pen'
  
    button?: number;
  
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
}  
