import { Vector3, Mesh, Quaternion, Object3D } from 'three'; 
import { GameStatus } from '../game.interface';
import { Brick } from '../shapes/brick';
export interface IWorld {

  update(): void;

  setVelocity(brick: Brick, velocity: Vector3): void;

  setGravity(gravity: Vector3): void;

  addBrick(brick: Brick, bufferIndex?: number): void;

  setStatus(status: GameStatus): void;

  explodeBrick(brick: Brick): void;

  applyImpulse(brick: Brick, impulse: Vector3, worldPoint: Vector3): void;

  removeBrick(brick: Brick): void;

  setPosition(index: number, position: Vector3): void;

  setQuaternion(index: number, quaternion: Quaternion): void;

  // addStaticPlane(instructions: StaticPlaneInstractions): void;

  setBoard(instructions: BoardInstructions): void;

  setStaticDropRowPlane(position: Vector3): void;

  resetStaticDropRowPlanes(): void;

  addCylinder(instructions: CylinderInstructions): void;
}

export interface ApplyImpulseParams {
  brick: Brick,
  impulse: Vector3,
  worldPoint: Vector3
}
export interface BoardInstructions {
  rows: number;
  cols: number;
  bottom: WallInstructions,
  left: WallInstructions,
  right: WallInstructions,
}
export interface WallInstructions { 
  bufferIndex?: number;
  position: Vector3,
  scale: Vector3,
  quaternion: Quaternion,
  object: Object3D
}

export interface StaticPlaneInstractions {
  // instructions: ObjectInstructions,
  mesh?: Mesh,
  size: Vector3,
  position: Vector3,
  quaternion: Quaternion
  name: string,
  type: string,
}

export interface CylinderInstructions {
  position: Vector3,
  quaternion: Quaternion,
  radiusTop: number;
  radiusBottom: number,
  height: number,
  numSegments: number,
  mass: number
}