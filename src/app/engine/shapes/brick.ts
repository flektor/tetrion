import { Group, Mesh, Material, BufferGeometry } from 'three';

export class Brick extends Group {

    public bufferIndex: number;
    private poolKey: string;

    constructor(
        params: {
            meshes?: Array<Mesh>,
            geometries?: BufferGeometry[],
            materials?: Material[]
        }
    ) {
        super();

        if (params.meshes) {
            this.add(...params.meshes);
            // params.meshes.forEach(mesh =>{
            //      mesh.castShadow = true;
            //      mesh.receiveShadow = true;
            //     })
            return;
        }

        for (let i = 0; i < params.geometries.length; i++) {
            if (params.materials instanceof Array) {
                let material = params.materials[0];
                if (params.materials[i]) {
                    material = params.materials[i];
                }
                const mesh = new Mesh(params.geometries[i], material);
                // mesh.castShadow = true;
                this.add(mesh);
            }
        }


        // this.castShadow = true;
        // this.receiveShadow = true;
        // this.updateMatrix(); // as needed
        this.scale.set(this.scale.x / 2, this.scale.y / 2, this.scale.z / 2)
    }

    duplicate() {
        let meshes: Mesh[] = new Array();
        for (let mesh of this.children) {
            meshes.push(<Mesh>mesh.clone())
        }
        let brick = new Brick({ meshes: meshes })
        brick.scale.copy(this.scale);
        brick.poolKey = this.poolKey;
        return brick;
    }

    getPrimaryMaterial(): Material {
        return <Material>(<Mesh>this.children[0]).material;
    }

    getSecondaryMaterial(): Material {
        if (<Mesh>this.children[1]) {
            return <Material>(<Mesh>this.children[1]).material;
        }
        return <Material>(<Mesh>this.children[0]).material;
    }


    setPoolKey(key: string) {
        this.poolKey = key;
    }


    getPoolKey(): string {
        return this.poolKey;
    }


    setCastShadow(isTrue: boolean): void {
        for (const mesh of this.children) {
            mesh.castShadow = isTrue;
        }
    }

    setReceiveShadow(isTrue: boolean): void {
        for (const mesh of this.children) {
            mesh.receiveShadow = isTrue;
        }
    }



}


