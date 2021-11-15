
import { Group, Vector2, FrontSide, MeshPhongMaterial, MeshPhongMaterialParameters } from 'three';
import { Tweens } from 'src/app/engine/tweens';
import { Block, BlockType } from 'src/app/engine/shapes/block';
import { BrickConfig, ThemeConfig } from '../services/theme/theme.interface';
import { Brick } from './shapes/brick';
import { GeometryLoader } from './geometry';
import { SkinEditable } from './scenario.interface';
import { SkinsMaker } from './skins-maker';


export class SkinsEditor implements SkinEditable {


    constructor(
        private group: Group,
        theme: ThemeConfig,
        private blockTypes: BlockType[],
        isRunningOnWorker: boolean


    ) {



        this.geometry = GeometryLoader.getInstance();

        this.skinsMaker = new SkinsMaker(this.geometry, isRunningOnWorker);

        this.tempTheme = JSON.parse(JSON.stringify(theme));

        const coords = [
            new Vector2(1.70, 3.61),
            new Vector2(3.77, 1.01),
            new Vector2(3.04, -2.23),
            new Vector2(0.04, -3.68),
            new Vector2(-2.96, -2.24),
            new Vector2(-3.70, 1.00),
            new Vector2(-1.63, 3.61)
        ];



        this.blocks = new Array();

        for (let i = 0; i < blockTypes.length; i++) {
            const brick = this.createBrick(this.tempTheme.bricks[i]);
            const bricks = [
                brick,
                brick.duplicate(),
                brick.duplicate(),
                brick.duplicate()
            ];

            this.addBlock(blockTypes[i], bricks, coords[i].x * 3, 0, -coords[i].y * 3);
        }

        this.render();

    }


    getSkin(index: number, size: number, materialParams: MeshPhongMaterialParameters[]): Promise<Blob> {
        return this.skinsMaker.getSkin(index, size, materialParams);
    }

    getSkinsNumber(): number {
        return this.geometry.all().length;
    }



    setThemeBrickGeometry(index: number): void {
        this.tempTheme.bricks[this.index].geometryIndex = index;
        this.overrideThemeBlock(this.index);
    }


    setThemePrimaryColor(color: string | number) {
        this.tempTheme.bricks[this.index].materialsParams[0].color = color;
    }


    setThemeSecondaryColor(color: string | number) {
        this.tempTheme.bricks[this.index].materialsParams[1].color = color;
    }


    nextΤhemeBlock(): Promise<boolean> {

        return new Promise(resolve => {

            if (this.tween && this.tween.isPlaying()) {
                return resolve(false);
            }

            const r = this.group.rotation;
            this.tween = Tweens.rotateHeptagon(r, 1, 200);

            this.index++;
            if (this.index == 7) {
                this.index = 0;
            }

            resolve(true);
        });
    }


    prevΤhemeBlock(): Promise<boolean> {
        return new Promise(resolve => {

            if (this.tween && this.tween.isPlaying()) {
                return resolve(false);
            }

            const r = this.group.rotation;
            this.tween = Tweens.rotateHeptagon(r, -1, 200);

            this.index--;
            if (this.index == -1) {
                this.index = 6;
            }
            resolve(true);

        });
    }


    setTheme(theme: ThemeConfig): void {
        this.tempTheme = JSON.parse(JSON.stringify(theme));
        for (let i = 0; i < this.blockTypes.length; i++) {
            this.overrideThemeBlock(i);
        }

    }


    overrideThemeBlock(index: number): void {
        const tempBlock = this.blocks[index];
        const type = this.blocks[index].blockType;
        const brick = this.createBrick(this.tempTheme.bricks[index]);
        const bricks = [brick,
            brick.duplicate(),
            brick.duplicate(),
            brick.duplicate()
        ];
        const block = new Block(type, bricks);
        block.position.copy(this.blocks[index].position);
        block.rotation.copy(this.blocks[index].rotation);

        block.setCastShadow(true);
        block.setReceiveShadow(true);
        this.group.remove(this.blocks[index]);
        this.group.add(block);
        this.blocks[index] = block;

        tempBlock.traverse((child: any) => {
            if (child.geometry !== undefined) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });

    }


    private createBrick(config: BrickConfig): Brick {
        const geometries = this.geometry.get(config.geometryIndex);
        const materials = new Array();

        for (let matParams of config.materialsParams) {
            matParams.side = FrontSide;
            materials.push(new MeshPhongMaterial(matParams));
        }
        return new Brick({ geometries, materials });
    }


    private render(): void {
        Tweens.update();
        for (let block of this.blocks) {
            if (block === this.blocks[this.index]) {
                block.rotateX(Math.PI * 0.0015);
                block.rotateY(Math.PI * 0.002);
                block.rotateZ(Math.PI * 0.005);
                continue;
            }
            block.rotateX(Math.PI * 0.0003);
            block.rotateY(Math.PI * 0.0005);
            block.rotateZ(Math.PI * 0.001);
        }

        if (!this.isHovering) {
            this.isHovering = true;
            Tweens.moveY(this.group.position, .5, 5000).onComplete(() => {
                Tweens.moveY(this.group.position, -.5, 5000).onComplete(() => { this.isHovering = false });
            });
        }

        requestAnimationFrame(() => this.render());
    }


    private addBlock(type: BlockType, bricks: Brick[], x: number, y: number, z: number): Block {
        const block = new Block(type, bricks, true);
        block.position.set(x, y, z);
        // block.lookAt(this.stage.camera.position);
        this.group.add(block);
        this.blocks[type.index] = block;
        block.setCastShadow(true);
        block.setReceiveShadow(true);
        return block;
    }

    private skinsMaker: SkinsMaker;

    private isHovering = false;
    private index: number = 3;
    private blocks: Array<Block>;
    private tempTheme: ThemeConfig;
    private geometry: GeometryLoader;
    private tween: any;

}
