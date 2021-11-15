import { AmbientLight, DirectionalLight, MeshPhongMaterial, MeshPhongMaterialParameters, SpotLight, WebGLRendererParameters } from 'three';
import { GeometryLoader } from './geometry';
import { Brick } from './shapes/brick';
import { SimpleStage } from './simple-stage';


export class SkinsMaker {


    constructor(private geometries: GeometryLoader, isRunningOnWorker: boolean) {
        this.init(isRunningOnWorker);
    }


    private init(isRunningOnWorker: boolean) {
        this.size = 128;
        const canvas = isRunningOnWorker ?
            new OffscreenCanvas(this.size, this.size)
            : document.createElement('canvas');


        canvas.width = this.size;
        canvas.height = this.size;

        const rendererParams: WebGLRendererParameters = {
            antialias: true,
            preserveDrawingBuffer: true,
            alpha: true,
            canvas: canvas
        }; 

        this.stage = new SimpleStage(rendererParams);
        this.stage.setSize(this.size, this.size);

        // Ambient light
        const light1 = new AmbientLight(0xcccccc); // soft white light
        this.stage.add(light1);
        // Directional Light
        let directionalLight = new DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 0, 100).normalize();
        this.stage.add(directionalLight);
        // white spotlight shining from the side, casting a shadow
        const spotLight = new SpotLight(0x404040, 2, 100, 100, 2);
        spotLight.position.set(10, 10, 100);
        this.stage.add(spotLight);

        this.stage.camera.zoom = 3.5;
        this.stage.camera.updateProjectionMatrix();

    }


    async getSkin(index: number, size: number, materialParams: MeshPhongMaterialParameters[]): Promise<Blob> {
        this.size = size; 
        this.materialParams = materialParams;

        return this.captureSkin(index);
    }


    private createBrick(geometryIndex: number): Brick {
        const geometries = this.geometries.get(geometryIndex);
        const materials = new Array();
        for (let params of this.materialParams) {
            materials.push(new MeshPhongMaterial(params))
        }
        return new Brick({ geometries, materials: materials });
    }


    private async captureSkin(index: number): Promise<Blob> {

        const brick = this.createBrick(index);
        brick.rotation.set(45, 35.264, 0);
        this.stage.add(brick);
        const blob = await this.captureImage();
        this.stage.remove(brick);
        this.stage.renderer.clear();

        return blob;
    }


    public captureImage(): Promise<Blob> {

        return this.stage.captureToBlob();
    }



    private size: number; 
    private materialParams: MeshPhongMaterialParameters[];

    private stage: SimpleStage;




}