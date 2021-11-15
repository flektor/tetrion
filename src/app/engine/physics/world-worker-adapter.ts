import { Remote } from 'comlink';
import { Brick } from '../shapes/brick';
import { BoardInstructions, CylinderInstructions, IWorld, WallInstructions } from '../physics/world.interface';
import { Vector3, Quaternion } from 'three';
import { GameStatus } from '../game.interface';
import { World } from 'src/app/worker/world.worker';
import { toVector3 as toVec3, toQuaternion as toQuat } from '../physics/utils'


export class WorldWorkerAdapter implements IWorld {

    private dt: number = 1 / 60;
    private lastTime: number;

    private kinematics: Map<number, Brick | WallInstructions> = new Map();

    private lastUsedBufferIndex: number = -1;
    private unusedBufferIndices: Array<number> = new Array();

    private cols: number;
    private rows: number;

    constructor(private world: Remote<World>, private positions: ArrayBuffer, private quaternions: ArrayBuffer) { }

    public async update(): Promise<number | void> {
        const time = Date.now();
        const lastTime = this.lastTime;
        this.lastTime = time;
        if (lastTime === undefined) return 0;

        this.dt = (time - lastTime) / 1000;

        if (this.kinematics.size === 0) return;

        await this.world.update(this.dt);

        // Get fresh data from the worker
        const positions = new Float32Array(this.positions);
        const quaternions = new Float32Array(this.quaternions);

        // Update rendering meshes
        for (const [key, kinematic] of this.kinematics) {
            let i = kinematic.bufferIndex * 3;
            kinematic.position.set(
                // positions[i],
                positions[i] + this.cols / 2,
                positions[i + 1],
                positions[i + 2]
            );
            i += kinematic.bufferIndex;
            kinematic.quaternion.set(
                quaternions[i],
                quaternions[i + 1],
                quaternions[i + 2],
                quaternions[i + 3]
            );
        }

        // // If the worker was faster than the time step (dt seconds), we want to delay the next timestep
        // let delay = this.dt * 1000 - (Date.now() - this.lastTime);
        // if (delay < 0) {
        //   delay = 0;
        // }
        // setTimeout(() => this.update(), delay);

        return this.dt;
    }

    public setVelocity(brick: Brick, velocity: Vector3): void {
        this.world.setVelocity(brick.bufferIndex, toVec3(velocity));
    }

    public setGravity(gravity: Vector3): void {
        this.world.setGravity(toVec3(gravity));

    }

    // public setGameOver(isTrue: boolean): void {
    //   this.worker.postMessage({
    //     task: 'setGameOver',
    //     isGameOver: isTrue
    //   });
    //   this.setGravity(new Vector3())
    // }

    public addBrick(brick: Brick): void {
        brick.bufferIndex = this.nextBufferIndex();
        this.world.addBrick(brick.bufferIndex, toVec3(brick.position), toQuat(brick.quaternion));
        this.kinematics.set(brick.bufferIndex, brick);
        brick.position.setX(brick.position.x + this.cols / 2);
        // this.positions[brick.bufferIndex] += this.cols/2;


    }

    public explodeBrick(brick: Brick) {
        this.world.explodeBrick(brick.bufferIndex);
    }

    public applyImpulse(brick: Brick, impulse: Vector3, worldPoint: Vector3): void {
        this.world.applyImpulse(brick.bufferIndex, toVec3(worldPoint), toVec3(impulse));
    }

    public removeBrick(brick: Brick): void {
        this.world.removeBrick(brick.bufferIndex);
        this.kinematics.delete(brick.bufferIndex);
        this.unusedBufferIndices.push(brick.bufferIndex);
    }

    public setPosition(index: number, position: Vector3): void {
        this.world.setPosition(index, toVec3(position));
        this.kinematics.get(index).position.copy(position);
    }

    public setQuaternion(index: number, quaternion: Quaternion): void {
        this.world.setQuaternion(index, toQuat(quaternion));
        this.kinematics.get(index).quaternion.copy(quaternion);
    }

    public setBoard(inst: BoardInstructions): void {
        this.rows = inst.rows;
        this.cols = inst.cols;

        inst.left.bufferIndex = this.nextBufferIndex();
        inst.right.bufferIndex = this.nextBufferIndex();

        this.world.setBoard({
            rows: inst.rows,
            cols: inst.cols,
            bottom: {
                position: toVec3(inst.bottom.position),
                quaternion: toQuat(inst.bottom.quaternion),
                scale: toVec3(inst.bottom.scale)
            },
            left: {
                bufferIndex: inst.left.bufferIndex,
                position: toVec3(inst.left.position),
                quaternion: toQuat(inst.left.quaternion),
                scale: toVec3(inst.left.scale)
            },
            right: {
                bufferIndex: inst.right.bufferIndex,
                position: toVec3(inst.right.position),
                quaternion: toQuat(inst.right.quaternion),
                scale: toVec3(inst.right.scale)
            },
        });

    }

    public setStatus(status: GameStatus) {
        this.world.setStatus(status);
        // if (status === GameStatus.GameOver) {
        //     const indices = [this.nextBufferIndex(), this.nextBufferIndex()];
        //     this.world.explodeWalls(indices);
        //     this.kinematics.set(this.boa.left.bufferIndex, inst.left);
        //     this.kinematics.set(inst.right.bufferIndex, inst.right);
        //     this.
        // }
    }

    public setStaticDropRowPlane(position: Vector3) {
        this.world.setStaticDropRowPlane(position as any);
    }

    public resetStaticDropRowPlanes() {
        this.world.resetStaticDropRowPlanes();
    }

    // public addRigitBody(object: Object3D, mass: number) {
    //   const instructions = new Array();

    //   for (let mesh of object.children) {
    //     instructions.push({
    //       vertices: (((mesh as Mesh).geometry as BufferGeometry).attributes.position || {}).array || [],
    //       mass: mass
    //     })

    //   }

    //   this.worker.postMessage({
    //     task: 'addBodyRigit',
    //     instructions: instructions,
    //   });
    //   this.bodiesCount++;
    // }

    public addCylinder(inst: CylinderInstructions) {
        this.world.addCylinder({
            position: toVec3(inst.position) as any,
            quaternion: toQuat(inst.quaternion) as any,
            radiusTop: inst.radiusTop,
            radiusBottom: inst.radiusBottom,
            height: inst.height,
            numSegments: inst.numSegments,
            mass: inst.mass
        });
    }

    private nextBufferIndex(): number {
        if (this.unusedBufferIndices.length > 0) {
            const index = this.unusedBufferIndices[0];
            this.unusedBufferIndices.splice(0, 1);
            return index;
        }
        return ++this.lastUsedBufferIndex;
    }
}



  // addBodyRigit(verts: number[], faces: number[], offset: number[], mass: number) {
  //   this.worker.postMessage({
  //     task: 'addBodyRigit',
  //     faces: faces,
  //     verts: verts,
  //     offset: offset,
  //     mass: mass
  //   });
  // }

  // public addContactMaterial(material: ContactMaterial): void {
  //   this.worker.postMessage({
  //     task: 'addContactMaterial',a
  //     material: material
  //   });
  // }

  // public addStaticPlane(instructions: StaticPlaneInstractions) {
  //   this.worker.postMessage({
  //     task: 'addStaticPlane',
  //     instructions: instructions
  //   });
  //   if (instructions.mesh) {
  //     this.staticMeshes.push(instructions.mesh)
  //   }
  //   this.bodiesCount++;
  // }

  // public rename(brick: Brick, name: string): void {
  //   this.worker.postMessage({
  //     task: 'rename',
  //     index: this.kinematics.indexOf(brick),
  //     name: name
  //   });
  // }
