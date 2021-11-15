import { Vector3, Quaternion, Object3D } from 'three';
import { Body, Vec3, NaiveBroadphase, World as CannonWorld, Material, ContactMaterial, Box, Cylinder, BODY_TYPES, Pool, Shape } from 'cannon-es';
import { IWorld, StaticPlaneInstractions, CylinderInstructions, WallInstructions, BoardInstructions } from './world.interface';
import { setQuat, setVec3, toQuat, toVec3 } from './utils';
import { GameStatus } from '../game.interface';
import { Brick } from '../shapes/brick';

export class World implements IWorld {

  constructor(private cols: number, private rows: number, poolSize?: number) {
    this.init(poolSize);
  }


  setVelocity(brick: Brick, velocity: Vector3): void {
    setVec3(this.kinematics.get(brick.bufferIndex).body.velocity, velocity);
  }


  applyImpulse(brick: Brick, impulse: Vector3, worldPoint: Vector3): void {
    this.kinematics.get(brick.bufferIndex).body.applyImpulse(toVec3(impulse), toVec3(worldPoint));
  }


  setPosition(index: number, position: Vector3): void {
    setVec3(this.kinematics.get(index).body.position, position)
  }


  setQuaternion(index: number, quaternion: Quaternion): void {
    setQuat(this.kinematics.get(index).body.quaternion, quaternion)
  }


  setGravity(gravity: Vector3) {
    setVec3(this.world.gravity, gravity);
  }


  getWorldInstance(): CannonWorld {
    return this.world;
  }


  addCylinder(inst: CylinderInstructions) {
    const shape = new Cylinder(inst.radiusTop, inst.radiusBottom, inst.height, inst.numSegments);
    const body = new Body({
      mass: inst.mass,
      material: this.groundMaterial
    });
    body.addShape(shape, toVec3(inst.position), toQuat(inst.quaternion));
    this.world.addBody(body);
  }


  setStatus(status: GameStatus): void {
    this.status = status;
    switch (status) {
      case GameStatus.Intro:
        for (const plane of this.staticPlanes) {
          this.world.removeBody(plane);
        }
        this.removeWalls();
        return;
      case GameStatus.GameOver:
        this.boardWalls.left.body.mass = 100;
        this.boardWalls.left.body.velocity.set(-15, 1, 0);
        this.boardWalls.left.body.updateMassProperties();
        this.boardWalls.right.body.mass = 100;
        this.boardWalls.right.body.velocity.set(15, 1, 0);
        this.boardWalls.right.body.updateMassProperties();
        return;
      case GameStatus.Game:
      case GameStatus.Replays:
        for (const plane of this.staticPlanes) {
          this.world.removeBody(plane);
        }
      // if (this.boardWalls) {
      //   this.removeWalls();
      //   this.world.addBody(this.boardWalls.bottom.body);
      //   this.world.addBody(this.boardWalls.left.body);
      //   this.world.addBody(this.boardWalls.right.body);
      // }
    }
  }


  addWall(inst: WallInstructions): IKinematic {

    const scale = new Vec3(inst.scale.x, inst.scale.y, inst.scale.z);
    const shape = new Box(scale);
    const body = new Body({
      mass: 0,
      material: this.groundMaterial,
      position: toVec3(inst.object.position),
      quaternion: toQuat(inst.object.quaternion),
      shape: shape,
      type: BODY_TYPES.DYNAMIC
      // velocity: i == 1 ? new Vec3(-15, 0, 0) : new Vec3(15, 0, 0)
    });
    body.addShape(shape);
    // body.position.copy(inst.position as any);
    // body.quaternion.copy(inst.quaternion as any);
    this.world.addBody(body);

    (inst.object as any).bufferIndex = body.id = this.bufferIndex++;

    const kinematic = {
      body: body,
      object: inst.object
    };
    return kinematic;
  }


  setBoard(instructions: BoardInstructions): void {

    if (this.boardWalls) {
      this.removeWalls();
    }
    this.rows = instructions.rows;
    this.cols = instructions.cols;

    this.boardWalls = {
      bottom: this.addWall(instructions.bottom),
      left: this.addWall(instructions.left),
      right: this.addWall(instructions.right)
    }
  }


  update() {

    if (this.kinematics.size === 0) return;

    const time = Date.now();
    const lastTime = this.lastTime;
    this.lastTime = time;
    if (lastTime === undefined) return;

    // const dt = (time - lastTime) / 1000;


    for (const [key, kinematic] of this.kinematics) {
      this.updateKinematic(kinematic);

      if (kinematic.object.parent) {
        kinematic.object.position.sub(kinematic.object.parent.position);
      }

      // kinematic.object.position.copy(kinematic.body.position as any).sub(kinematic.object.parent.position);
      // kinematic.object.quaternion.copy(kinematic.body.quaternion as any);
    }

    if (this.status === GameStatus.GameOver) {
      this.updateKinematic(this.boardWalls.left);
      this.updateKinematic(this.boardWalls.right);
    }

    const dt = 1 / 60;
    this.world.step(dt);
  }


  setStaticDropRowPlane(position: Vector3): void {
    if (this.lastDropRowPlaneIndex >= 4) {
      this.resetStaticDropRowPlanes();
    }
    this.staticPlanes[this.lastDropRowPlaneIndex].position.set(position.x, position.y, position.z);
    this.lastDropRowPlaneIndex++;
  }


  resetStaticDropRowPlanes(): void {
    for (let i = 0; i < this.lastDropRowPlaneIndex; i++) {
      // if (staticPlanes[i].position.z == z) {
      this.staticPlanes[i].position.y = -0.5;
    }
    this.lastDropRowPlaneIndex = 0;
  }


  initStaticDropRowPlanes(): void {
    const instructions: StaticPlaneInstractions = {
      type: '',
      name: 'ground',
      size: new Vec3(this.cols / 2 + 2, 1) as any,
      position: new Vec3(this.cols / 2 - 2.7, -0.5, 0.5) as any,
      quaternion: new Quaternion(0.7071, 0, 0, 0.7071) as any
    };

    for (let i = 0; i < 4; i++) {
      this.addStaticPlane(instructions);
    }
    this.lastDropRowPlaneIndex = 0;
  }


  addStaticPlane(instructions: StaticPlaneInstractions) {
    const size = new Vec3(instructions.size.x / 2, instructions.size.y / 2, 0.0001);
    const shape = new Box(size);
    const config = {
      mass: 0,
      material: this.groundMaterial,
      // position: instructions.position as Vec3,
      // quaternion: instructions.quaternion
    }

    const body = new Body(config);
    body.addShape(shape);
    this.world.addBody(body);
    setVec3(body.position, instructions.position);
    setQuat(body.quaternion, instructions.quaternion);
    return this.staticPlanes.push(body);
  }


  addBrick(brick: Brick): void {
    const body = this.getBox();
    body.position.copy(toVec3(brick.position))
    body.quaternion.copy(toQuat(brick.quaternion))
    body.id = this.bufferIndex++;
    brick.bufferIndex = body.id;
    this.kinematics.set(body.id, { object: brick, body });
    this.world.addBody(body);
  }


  removeBrick(brick: Brick): void {
    const body = this.kinematics.get(brick.bufferIndex).body;
    body.velocity.setZero();
    body.angularVelocity.setZero();
    this.pool.objects.push(body);
    this.world.removeBody(body);
    this.kinematics.delete(brick.bufferIndex);
  }


  explodeBrick(brick: Brick): void {
    const power = -0.5;
    const radius = 10;

    for (const [key, kinematic] of this.kinematics) {
      const diff = kinematic.body.position.vsub(this.kinematics.get(brick.bufferIndex).body.position);
      const val = Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2) + Math.pow(diff.z, 2));
      if (val < radius) {
        const impulse = new Vec3(val * power, val * power, val * power);
        kinematic.body.applyLocalImpulse(impulse, kinematic.body.position);
      }
    }
  }


  private createBox() {
    return new Body({
      mass: 1,
      material: this.boxMaterial,
      shape: this.boxShape
    });
  }


  private getBox(): Body {
    if (this.pool.objects.length === 0) {
      return this.createBox();
    } else {
      return this.pool.get();
    }
  }


  private updateKinematic(kinematic: IKinematic, subParent?: boolean) {
    kinematic.object.position.copy(kinematic.body.position as any);
    kinematic.object.quaternion.copy(kinematic.body.quaternion as any);
  }


  private removeWalls(walls?: {
    bottom?: boolean,
    left?: boolean,
    right?: boolean,
  }) {
    if (walls) {
      if (walls.bottom) this.world.removeBody(this.boardWalls.bottom.body);

      if (walls.left) this.world.removeBody(this.boardWalls.left.body);

      if (walls.right) this.world.removeBody(this.boardWalls.right.body);
    } else {
      this.world.removeBody(this.boardWalls.bottom.body);
      this.world.removeBody(this.boardWalls.left.body);
      this.world.removeBody(this.boardWalls.right.body);
    }

  }


  private init(poolSize?: number) {

    if (!poolSize) {
      poolSize = this.cols * 4;
    }

    this.boxShape = new Box(new Vec3(0.5, 0.5, 0.5));
    this.pool = new Pool();
    for (let i = 0; i < poolSize; i++) {
      this.pool.objects.push(this.createBox());
    }

    this.world = new CannonWorld();
    this.world.broadphase = new NaiveBroadphase();
    this.world.gravity.set(0, -19, 0); // m/s²
    // this.world.solver.tolerance = 0.001;

    this.boxMaterial = new Material("boxMaterial");
    this.groundMaterial = new Material("groundMaterial");
    this.hfMaterial = new Material("hfMaterial");

    this.world.addContactMaterial(
      new ContactMaterial(this.boxMaterial, this.groundMaterial, {
        friction: 10
      })
    );
    this.world.addContactMaterial(
      new ContactMaterial(this.boxMaterial, this.hfMaterial, {
        friction: 10,
        restitution: 0
      })
    );

    this.initStaticDropRowPlanes();
  }


  private pool: Pool;
  private world: CannonWorld;
  private boxMaterial: Material;
  private groundMaterial: Material;
  private hfMaterial: Material;

  private kinematics = new Map<number, IKinematic>();
  private staticPlanes = new Array<Body>();
  private lastDropRowPlaneIndex: number;
  private status: GameStatus;
  private boxShape: Shape;

  private lastTime: number;
  private bufferIndex: number = 0;

  private boardWalls: {
    bottom: IKinematic,
    left: IKinematic,
    right: IKinematic,
  };

}



export interface IKinematic {
  object: Object3D,
  body: Body
}


//  addRigitBody(object: Object3D, mass: number) {
//   const shape = threeToCannon(object, { type: threeToCannon.Type.MESH }) as Shape;
//   const body = new Body({
//     mass: mass,
//     material: this.groundMaterial,
//   });

//   body.addShape(shape, object.position as any, object.quaternion as any)
//   this.world.addBody(body);
// }