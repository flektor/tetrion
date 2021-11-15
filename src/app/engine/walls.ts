import { Object3D, Quaternion, Vector3 } from 'three';
import { GameConfig } from './game.interface';
import { Tweens } from './tweens';
import { BoardInstructions, WallInstructions } from './physics/world.interface';

export class BoardWalls {

    private gameConf: GameConfig;

    constructor(private walls: Walls, gameConf: GameConfig) {
        this.init(gameConf);
    }

    private instructions: BoardInstructions;

    private initPositions: {
        bottom: InitWallPositions;
        left: InitWallPositions;
        right: InitWallPositions;
    }

    getInstructions(): BoardInstructions {
        return this.instructions;
    }

    setVisible(isTrue: boolean): void {
        this.walls.bottom.visible = isTrue;
        this.walls.left.visible = isTrue;
        this.walls.right.visible = isTrue;
    }


    setCastShadow(isTrue: boolean): void {
        this.walls.right.castShadow = isTrue;
        this.walls.left.castShadow = isTrue;
        this.walls.bottom.castShadow = isTrue;
    }

    setReceiveShadow(isTrue: boolean): void {
        this.walls.right.receiveShadow = isTrue;
        this.walls.left.receiveShadow = isTrue;
        this.walls.bottom.receiveShadow = isTrue;
    }


    private getWallInstructions(object: Object3D): WallInstructions {
        return {
            scale: object.scale,
            position: object.position,
            quaternion: object.quaternion as any,
            object: object
        };
    }

    init(gameConf: GameConfig): void {

        if (this.gameConf) {
            this.resetPositions();
            if (!this.configChanged(gameConf)) {
                return;
            }
        }

        this.gameConf = gameConf;

        // const scaleZ = this.game.getPlayers().length === 2 ? 6 : 3;
        const scaleZ = 3;

        // bottom wall
        this.walls.bottom.scale.setY(this.gameConf.cols / 2);
        this.walls.bottom.scale.setZ(scaleZ);
        // this.walls.bottom.position.setZ(0.1); 

        // left wall
        this.walls.left.scale.setY(this.gameConf.rows / 2 + 0.5);
        this.walls.left.scale.setZ(scaleZ);
        this.walls.left.position.setX(-this.gameConf.cols / 2 - 0.5);
        this.walls.left.position.setY(this.gameConf.rows / 2 - 0.5); 

        // right wall
        this.walls.right.scale.setY(this.gameConf.rows / 2 + 0.5);
        this.walls.right.scale.setZ(scaleZ);
        this.walls.right.position.setX(this.gameConf.cols / 2 + 0.5);
        this.walls.right.position.setY(this.gameConf.rows / 2 - 0.5); 

        this.instructions = {
            rows: this.gameConf.rows,
            cols: this.gameConf.cols,
            bottom: this.getWallInstructions(this.walls.bottom),
            left: this.getWallInstructions(this.walls.left),
            right: this.getWallInstructions(this.walls.right)
        }


        this.setInitPositions();
    }
    private setInitPositions() {
        // if (this.initPositions) {
        //     return;
        // }

        this.initPositions = {
            bottom: {
                position: this.walls.bottom.position.clone(),
                quaternion: this.walls.bottom.quaternion.clone()
            },
            right: {
                position: this.walls.right.position.clone(),
                quaternion: this.walls.right.quaternion.clone()
            },
            left: {
                position: this.walls.left.position.clone(),
                quaternion: this.walls.left.quaternion.clone()
            },
        }
    }

    public animate(): void {

        const y = this.gameConf.rows * 2;
        this.walls.bottom.position.setY(y);
        this.walls.left.position.setY(y);
        this.walls.right.position.setY(y);

        const duration = 1500;

        Tweens.fallWithBounce(
            this.walls.bottom.position,
            this.initPositions.bottom.position.y,
            duration,
            Math.floor(Math.random() * 4) * 100
        );

        Tweens.fallWithBounce(
            this.walls.left.position,
            this.initPositions.left.position.y,
            duration,
            Math.floor(Math.random() * 4) * 100 + 500
        );

        Tweens.fallWithBounce(
            this.walls.right.position,
            this.initPositions.right.position.y,
            duration,
            Math.floor(Math.random() * 4) * 100 + 500
        );
    }

    private configChanged(gameConf: GameConfig): boolean {
        if (this.gameConf.rows !== gameConf.rows) {
            return true;
        }

        if (this.gameConf.cols !== gameConf.cols) {
            return true;
        }

        if (this.gameConf.mode !== gameConf.mode) {
            return true;
        }

        return false;
    }

    private resetPositions() {
        this.walls.left.quaternion.copy(this.initPositions.left.quaternion);
        this.walls.left.position.copy(this.initPositions.left.position);
        this.walls.right.quaternion.copy(this.initPositions.right.quaternion);
        this.walls.right.position.copy(this.initPositions.right.position);
    }
}


export interface Walls {
    bottom: Object3D;
    right: Object3D;
    left: Object3D;
}

interface InitWallPositions {
    position: Vector3;
    quaternion: Quaternion;
}
