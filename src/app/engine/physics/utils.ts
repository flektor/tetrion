import { Vec3 as CannonVec3, Quaternion as CannonQuaternion } from 'cannon-es';
import { Vector3 as ThreeVector3, Quaternion as ThreeQuaternion } from 'three';
// import { Vec3, Quaternion as CannonQuaternion } from 'cannon-es';


export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
}

export interface IBoardWallWorker {
    bufferIndex?: number,
    scale: Vector3,
    position: Vector3,
    quaternion: Quaternion
}

export interface IBoardInstructionsWorker {
    rows: number,
    cols: number,
    bottom: IBoardWallWorker,
    left: IBoardWallWorker,
    right: IBoardWallWorker
}

export const toVector3 = (vec3: ThreeVector3): Vector3 => {
    return { x: vec3.x, y: vec3.y, z: vec3.z };
}

export const toQuaternion = (quat: ThreeQuaternion): Quaternion => {
    return { x: quat.x, y: quat.y, z: quat.z, w: quat.w };
}

export const toVec3 = (vector: Vector3): CannonVec3 => {
    return new CannonVec3(vector.x, vector.y, vector.z);
}

export const toQuat = (quat: Quaternion): CannonQuaternion => {
    return new CannonQuaternion(quat.x, quat.y, quat.z, quat.w);
}

export const setVec3 = (vec3: CannonVec3, vector3: Vector3) => {
    vec3.set(vector3.x, vector3.y, vector3.z)
}

export const setQuat = (cannonQuat: CannonQuaternion, quat: Quaternion) => {
    cannonQuat.set(quat.x, quat.y, quat.z, quat.w)
}
