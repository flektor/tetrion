import { BufferGeometry, Mesh } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export class GeometryLoader {

    private static instance: GeometryLoader;
    private geometries: Array<Array<BufferGeometry>>;
    private terrain: GLTF;
    length: number;

    private isLoaded: boolean = false;

    private constructor() { }

    static getInstance(): GeometryLoader {
        if (this.instance) return this.instance;
        return this.instance = new GeometryLoader();
    }

    async load() {
        if (this.isLoaded) return;

        this.geometries = new Array();
        this.length = 0;
        await Promise.all([
            this.loadTerrain(),
            this.loadBoxes()
        ]);
        this.isLoaded = true;
    }


    getTerrain(): GLTF {
        return this.terrain;
    }

    get(index: number): Array<BufferGeometry> {
        return this.geometries[index];
    }

    all(): Array<Array<BufferGeometry>> {
        return this.geometries;
    }


    private async loadTerrain(): Promise<void> {
        let terrain = await this.loadGLTF('assets/models/canyon.glb')
        if (terrain) {
            this.terrain = terrain;
            // for (let child of terrain.scene.children) {
            //     let s = child.scale;
            //     let p = child.position;
            //     s.set(s.x / 2, s.y / 2, s.z / 2)
            //     p.set(p.x / 2, p.y / 2-1, p.z / 2)
            // }
        }
    }



    private async loadBoxes(file: string = 'assets/models/boxes.glb'): Promise<Array<Array<BufferGeometry>> | void> {

        if (this.geometries.length > 0) {
            return this.geometries;
        }

        let gltf = (await this.loadGLTF(file));
        if (!gltf) return;

        for (let box of gltf.scene.children) {
            let geometries = new Array();
            for (let mesh of box.children) {
                geometries.push((mesh as Mesh).geometry);
            }

            this.geometries.push(geometries);
        }
        this.length = this.geometries.length;
        return this.geometries;
    }




    async loadGLTF(file: string): Promise<GLTF | void> {
        try {
            let gltf = <GLTF>await new Promise((resolve, reject) => {
                new GLTFLoader().load(file, resolve, null, reject);
            });
            return gltf;
        } catch (error) {
            console.error("Error: ", error);
        }

    }



}