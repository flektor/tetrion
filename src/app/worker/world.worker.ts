
import { expose } from 'comlink';
import { Material, World as CannonWorld, Body, Box, BODY_TYPES, Cylinder, ContactMaterial, NaiveBroadphase, Vec3, Quaternion as CannonQuaternion } from 'cannon-es';
import { GameStatus } from '../engine/game.interface';
import { StaticPlaneInstractions, CylinderInstructions } from '../engine/physics/world.interface';
import { IBoardInstructionsWorker, IBoardWallWorker, Quaternion, setQuat, setVec3, toQuat, toVec3, Vector3 } from '../engine/physics/utils';

// var _tempPositions;
// var _tempQuaternions;

// addEventListener('message', e => {
//     if (!e.data.operation) return;
//     if (e.data.operation === "initSharedBuffers") {
//         _tempPositions = new Float32Array(e.data.positions);
//         _tempQuaternions = new Float32Array(e.data.quaternions);
//     }
// });




export class World {

    private positions: Float32Array;
    private quaternions: Float32Array;
    private world: CannonWorld;
    private boxMaterial: Material;
    private groundMaterial: Material;
    private hfMaterial: Material;
    private kinematics: Map<number, Body>;
    private staticPlanes: Array<Body>;
    private lastDropRowPlaneIndex: number;
    private cols: number;
    private lastTime: number;
    private status: GameStatus;
    private boardWalls: {
        bottom: Body,
        left: Body,
        right: Body,
    };
 
    public async init(positions: ArrayBuffer, quaternions: ArrayBuffer): Promise<void> {
 
        this.positions = new Float32Array(positions);
        this.quaternions = new Float32Array(quaternions);
 
        this.kinematics = new Map<number, Body>();
        this.staticPlanes = new Array();
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
        return;
        // this.boardWalls
    }
  
    private updateData = (bufferIndex: number, position: Vec3, quaternion: CannonQuaternion) => {
        let i = bufferIndex * 3;
        this.positions[i] = position.x;
        this.positions[i + 1] = position.y;
        this.positions[i + 2] = position.z;
        i += bufferIndex;
        this.quaternions[i] = quaternion.x;
        this.quaternions[i + 1] = quaternion.y;
        this.quaternions[i + 2] = quaternion.z;
        this.quaternions[i + 3] = quaternion.w;
    }

    public async update(dt: number): Promise<void> {
        if (this.kinematics.size === 0) return;

        // const time = Date.now();
        // const lastTime = this.lastTime;
        // this.lastTime = time;
        // if (lastTime === undefined) return;

        // const dt = (time - lastTime) / 1000;
        // const dt = 1 / 60;

        this.world.step(dt);

        for (const [key, kinematic] of this.kinematics) {
            this.updateData(key, kinematic.position, kinematic.quaternion);
        }


        // if (this.status === GameStatus.GameOver) {
        //     this.boardWalls.right.position.copy(this.boardWalls.right.body.position as any);
        //     this.boardWalls.right.quaternion.copy(this.boardWalls.right.body.quaternion as any);
        //     this.boardWalls.left.position.copy(this.boardWalls.left.body.position as any);
        //     this.boardWalls.left.quaternion.copy(this.boardWalls.left.body.quaternion as any);
        // }
    }

    setVelocity(index: number, velocity: Vector3): void {
        setVec3(this.kinematics.get(index).velocity, velocity);
    }

    setGravity(gravity: Vector3): void {
        this.world.gravity.copy(toVec3(gravity));
    }

    addBrick(bufferIndex: number, position: Vector3, quaternion: Quaternion): void {
        const shape = new Box(new Vec3(0.5, 0.5, 0.5));
        const body = new Body({
            mass: 1,
            material: this.boxMaterial,
            position: toVec3(position),
            quaternion: toQuat(quaternion),
        });
        body.id = bufferIndex;
        body.addShape(shape);
        this.kinematics.set(bufferIndex, body);
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
                this.boardWalls.left.mass = 100;
                this.boardWalls.left.velocity.set(-15, 1, 0);
                this.boardWalls.left.updateMassProperties();
                this.boardWalls.right.mass = 100;
                this.boardWalls.right.velocity.set(15, 1, 0);
                this.boardWalls.right.updateMassProperties();
                this.kinematics.set(this.boardWalls.left.id, this.boardWalls.left);
                this.kinematics.set(this.boardWalls.right.id, this.boardWalls.right);
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

    explodeBrick(bufferIndex: number): void {
        const power = -0.5;
        const radius = 10;

        for (const [key, kinematic] of this.kinematics) {
            const diff = kinematic.position.vsub(this.kinematics.get(bufferIndex).position);
            const val = Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2) + Math.pow(diff.z, 2));
            if (val < radius) {
                const value = val * power;
                const impulse = toVec3({ x: value, y: value, z: value });
                kinematic.applyLocalImpulse(impulse, kinematic.position);
            }
        }
    }

    applyImpulse(index: number, worldPoint: Vector3, impulse: Vector3): void {
        this.kinematics.get(index).applyImpulse(toVec3(impulse), toVec3(worldPoint));
    }

    removeBrick(index: number): void {
        this.world.removeBody(this.kinematics.get(index));
        this.kinematics.delete(index);
    }

    setPosition(index: number, position: Vector3): void {
        setVec3(this.kinematics.get(index).position, position);
    }

    setQuaternion(index: number, quaternion: Quaternion): void {
        setQuat(this.kinematics.get(index).quaternion, quaternion);
    }

    setBoard(instructions: IBoardInstructionsWorker): void {
        this.cols = instructions.cols;

        if (this.boardWalls) {
            this.removeWalls();
        }

        this.boardWalls = {
            bottom: this.addWall(instructions.bottom),
            left: this.addWall(instructions.left),
            right: this.addWall(instructions.right)
        }
    }

    setStaticDropRowPlane(position: Vector3): void {
        if (this.lastDropRowPlaneIndex >= 4) {
            this.resetStaticDropRowPlanes();
        }
        setVec3(this.staticPlanes[this.lastDropRowPlaneIndex].position, position);
        this.lastDropRowPlaneIndex++;
    }
    resetStaticDropRowPlanes(): void {
        for (let i = 0; i < this.lastDropRowPlaneIndex; i++) {
            // if (staticPlanes[i].position.z == z) {
            this.staticPlanes[i].position.y = -0.5;
        }
        this.lastDropRowPlaneIndex = 0;
    }


    public initStaticDropRowPlanes(): void {
        const instructions: StaticPlaneInstractions = {
            type: '',
            name: 'ground',
            size: new Vec3(this.cols / 2 + 2, 1) as any,
            position: new Vec3(this.cols / 2 - 2.7, -0.5, 0.5) as any,
            quaternion: new CannonQuaternion(0.7071, 0, 0, 0.7071) as any
        };

        for (let i = 0; i < 4; i++) {
            this.addStaticPlane(instructions);
        }
        this.lastDropRowPlaneIndex = 0;
    }


    public addStaticPlane(inst: StaticPlaneInstractions) {
        const size = new Vec3(inst.size.x / 2, inst.size.y / 2, 0.0001);
        const shape = new Box(size);
        const config = {
            mass: 0,
            material: this.groundMaterial,
            // position: instructions.position as Vector3,
            // quaternion: instructions.quaternion
        }

        const body = new Body(config);
        body.addShape(shape);
        this.world.addBody(body);
        setVec3(body.position, inst.position);
        setQuat(body.quaternion, inst.quaternion);
        return this.staticPlanes.push(body);
    }

    addCylinder(inst: CylinderInstructions): void {

        const shape = new Cylinder(inst.radiusTop, inst.radiusBottom, inst.height, inst.numSegments);
        const body = new Body({
            mass: inst.mass,
            material: this.groundMaterial
        });

        body.addShape(shape, inst.position as any, inst.quaternion as any);
        this.world.addBody(body);
    }


    private removeWalls(walls?: {
        bottom?: boolean,
        left?: boolean,
        right?: boolean,
    }) {
        if (walls) {
            if (walls.bottom) this.world.removeBody(this.boardWalls.bottom);

            if (walls.left) this.world.removeBody(this.boardWalls.left);

            if (walls.right) this.world.removeBody(this.boardWalls.right);
        } else {
            this.world.removeBody(this.boardWalls.bottom);
            this.world.removeBody(this.boardWalls.left);
            this.world.removeBody(this.boardWalls.right);
        }

    }

    private addWall(params: IBoardWallWorker): Body {

        const shape = new Box(toVec3(params.scale));
        const body = new Body({
            mass: 0,
            material: this.groundMaterial,
            position: toVec3(params.position),
            quaternion: toQuat(params.quaternion),
            shape: shape,
            type: params.bufferIndex !== undefined ? BODY_TYPES.DYNAMIC : BODY_TYPES.STATIC
            // velocity: i == 1 ? new Vector3(-15, 0, 0) : new Vector3(15, 0, 0)
        });
        body.addShape(shape);
        // body.position.copy(inst.position as any);
        // body.quaternion.copy(inst.quaternion as any);
        this.world.addBody(body);

        return body;
    }


}

expose(World);
