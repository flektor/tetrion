import { MeshPhongMaterialParameters } from "three";

export interface ThemeConfig {
    name: string;
    bricks: Array<BrickConfig>;
    custom: boolean;
    permissions?: 'private' | 'public';
}

export interface BrickConfig {
    materialsParams: MeshPhongMaterialParameters[];
    geometryIndex: number;
}