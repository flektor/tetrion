import { FrontSide, MeshPhongMaterial, MeshBasicMaterial, BoxBufferGeometry, Group, MeshPhongMaterialParameters, Material, Object3D, Vector3, Quaternion, ObjectSpaceNormalMap } from "three";

import * as clone from 'lodash.clonedeep';
import { SHA1 } from 'crypto-js';
import { Player } from './player';
import { ThemeConfig, BrickConfig } from '../services/theme/theme.interface';
import { Block, BlockType } from 'src/app/engine/shapes/block';
import { Brick } from 'src/app/engine/shapes/brick';
import { GeometryLoader } from './geometry';

// interface IShadowsConfig {
//   castShadow: boolean;
//   receiveShadow: boolean;
// }

export class Pool {


  // setShadows(shadows:IShadowsConfig) : void {
  //   // for(let )
  // }


  constructor() {

    this.geometries = GeometryLoader.getInstance();
    this.brickPoolMap = new Map();
    this.blockPoolMap = new Map();
    // this.planePoolMap = new Map();
    this.groupPool = new ObjectPool();
    this.vector3Pool = new ObjectPool();
    this.materials = new Map();

    this.vbrickGeometry = new BoxBufferGeometry(1, 1, 1);
    this.vbrickMaterial = new MeshBasicMaterial();
    // this.planeGeometry

    // const mesh = new Mesh(new PlaneBufferGeometry(1, 1), material);

    this.createGroupPool(40);
    this.createVector3Pool(40);
    this.vbrickMaterial.depthTest = false;
  }



  // reaquires all 3D Objects
  resetObjectPools(): void {
    this.brickPoolMap.forEach(pool => pool.resetPool());
    this.blockPoolMap.forEach(pool => pool.resetPool());
  }


  clearObjectPools(): void {
    this.brickPoolMap.forEach(pool => pool.clearPool());
    this.blockPoolMap.forEach(pool => pool.clearPool());
  }



  destroyPool() {

    this.blockPoolMap.forEach((pool, key) => {
      pool.disposeAll()
      this.blockPoolMap.delete(key);
    });

    this.brickPoolMap.forEach((pool, key) => {
      pool.disposeAll()
      this.brickPoolMap.delete(key);
    });

    this.materials.forEach((material, key) => {
      material.dispose()
      this.materials.delete(key);
    });

  }


  loadPlayerObjects(
    player: Player,
    blockTypes: Array<BlockType>,
    brickPoolSize: number,
    blockPoolSize: number
  ) {
    const brickKeys = new Array<string>();
    const blockKeys = new Array<string>();  // normal blocks ids
    const cblockKeys = new Array<string>(); // centerd blocks ids
    const pblockKeys = new Array<string>(); // projection blocks ids
    const vblockKeys = new Array<string>(); // validation blocks ids

    const theme = player.getTheme();
    const ptheme = <ThemeConfig>clone(theme);

    const vbrickParams = {
      geometries: [this.vbrickGeometry],
      materials: [this.vbrickMaterial]
    }

    for (let i = 0; i < blockTypes.length; i++) {

      for (let matParams of theme.bricks[i].materialsParams) {
        // matParams.depthTest = true;
      }

      for (let matParams of ptheme.bricks[i].materialsParams) {
        matParams.transparent = true;
        matParams.opacity = 0.5;
        matParams.depthTest = false;
      }
      const brick = this.createBrick(theme.bricks[i]);
      brick.renderOrder = 1;
      this.createBrickPool(brick, brickPoolSize);
      brickKeys.push(brick.getPoolKey());



      const pbrick = this.createBrick(ptheme.bricks[i]);  
      brick.renderOrder = 0;

      this.createBrickPool(pbrick, 4);


      const vbrick = new Brick(vbrickParams);
      vbrick.setPoolKey('vbrick');
      this.createBrickPool(vbrick, 4);

      const block = this.createBlock(blockTypes[i], brick.getPoolKey());
      // block.renderOrder = 1;
      this.createBlockPool(block, brick.getPoolKey(), blockPoolSize);
      blockKeys.push(block.getPoolKey());


      const cblock = this.createBlock(blockTypes[i], brick.getPoolKey(), true);
      this.createBlockPool(cblock, brick.getPoolKey(), 1);
      cblockKeys.push(cblock.getPoolKey());
      
      const pblock = this.createBlock(blockTypes[i], pbrick.getPoolKey());
      // pblock.renderOrder = 0;
      this.createBlockPool(pblock, pbrick.getPoolKey(), 1);
      pblockKeys.push(pblock.getPoolKey());

      const vblock = this.createBlock(blockTypes[i], vbrick.getPoolKey());
      this.createBlockPool(vblock, vbrick.getPoolKey(), 1);
      vblockKeys.push(vblock.getPoolKey());

    }

    player.setPoolKeys({
      brickKeys: brickKeys,
      blockKeys: blockKeys,
      cblockKeys: cblockKeys,
      vblockKeys: vblockKeys,
      pblockKeys: pblockKeys
    });

  }


  // private consolePoolSize(keys: Array<number>, map: Object) {

  //   for (let key of keys) {
  //     const pool = <Object3DPool>map[key];
  //     const object = {
  //       id: key,
  //       size: pool.getSize(),
  //       locked: pool.getLockedSize(),
  //       unlocked: pool.getUnlockedSize()
  //     }
  //     console.log(object);
  //   }

  // }

  aquireGroup(group?: Group): void {

    // // test consoleeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
    // const size = this.groupPool.getSize();
    // console.log('aquire, groups pool size ' + size);

    if (group) {
      group.visible = false;
      this.groupPool.acquire(group);
      return;
    }
    this.groupPool.acquire(new Group());
  }

  /**
   * @throws {PoolOutOfObjectsError}
   */
  releaseGroup(): Group {
    try {
      return <Group>this.groupPool.release();
    } catch (PoolOutOfObjectsError) {
      throw PoolOutOfObjectsError;
    }

    // finally {
    //   // test  consoleeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
    //   const size = this.groupPool.getSize();
    //   console.log('release, groups pool size ' + size);
    // }
  }


  aquireVector3(vector3?: Vector3): void {

    if (vector3) {
      vector3.set(0, 0, 0);
      this.vector3Pool.acquire(vector3);
      return;
    }


    this.vector3Pool.acquire(new Vector3());

    // test consoleeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
    // console.log('new created, vector3 pool size ' + this.vector3Pool.getSize());

  }


  releaseVector3(): Vector3 {
    try {
      return <Vector3>this.vector3Pool.release();
    } catch (PoolOutOfObjectsError) {
      throw PoolOutOfObjectsError;
    }

    finally {
      // test  consoleeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
      const size = this.vector3Pool.getSize();
      // console.log('release, vector pool size ' + size);
      // throw new Error();
    }
  }





  deleteBrickPool(key: string): void {
    if (this.brickPoolMap.has(key)) {
      this.brickPoolMap.delete(key);
    }
  }

  deleteBlockPool(key: string): void {
    if (this.blockPoolMap.has(key)) {
      this.blockPoolMap.delete(key);
    }
  }


  getBrickUnlockedSize(key: string): number {
    return this.brickPoolMap.get(key).getUnlockedSize();
  }

  duplicateBricksToPool(brick: Brick, quantity: number) {
    const pool = this.brickPoolMap.get(brick.getPoolKey());
    for (let i = 0; i < quantity; i++) {
      pool.acquire(brick.duplicate());
    }
  }

  createBrickPool(brick: Brick, size: number, maxSize?: number): string {
    let pool: Object3DPool<Brick>;
    const key = brick.getPoolKey()
    if (this.brickPoolMap.has(key)) {
      pool = this.brickPoolMap.get(key)
    } else {
      pool = new Object3DPool(maxSize);
    }

    pool.acquire(brick);

    for (let i = 0; i < size - 1; i++) {
      pool.acquire(brick.duplicate());
    }

    this.brickPoolMap.set(key, pool);
    return key;
  }


  createBlockPool(block: Block, brickKey: string, size: number, maxSize?: number): string {
    const brickPool = this.brickPoolMap.get(brickKey);

    let pool: Object3DPool<Block>;

    if (size > brickPool.getUnlockedSize() / 4) {
      size = brickPool.getUnlockedSize() / 4;
    }

    const key = block.getPoolKey();
    if (this.blockPoolMap.has(key)) {
      pool = this.blockPoolMap.get(key);
    } else {
      pool = new Object3DPool(maxSize);
    }

    pool.acquire(block);

    for (let i = 0; i < size - 1; i++) {
      pool.acquire(this.createBlock(block.blockType, brickKey));
    }
    this.blockPoolMap.set(key, pool);

    return key;
  }

  /**
   * 
   * @throws {PoolOutOfObjectsError , Error}
   */
  releaseBrick(key: string, shadows?: IBrickShadowParams): Brick {
    if (this.brickPoolMap.has(key)) {
      const pool = this.brickPoolMap.get(key);

      try {
        const brick = pool.release() as Brick;
        if (!shadows) return brick;
        if (shadows.castShadow !== undefined) brick.setCastShadow(shadows.castShadow);
        if (shadows.receiveShadow !== undefined) brick.setReceiveShadow(shadows.receiveShadow);

        return brick;

      } catch (error) {

        // const object = pool.
        // this.locked.push(object);

        // object.visible = true;

        console.error('pool out of objects, cloned a new one!', error)
        // return object;



        throw error;
      }
    }
    throw new PoolOutOfObjectsError('There is no instance of brick pool with key' + key);
  }


  releaseBlock(key: string, params?: IReleaseBlockParams): Block {
    if (this.blockPoolMap.has(key)) {
      try {
        const block = this.blockPoolMap.get(key).release() as Block;
        if (!params) return block;


        if (params.position) block.position.copy(params.position);
        if (params.quaternion) block.quaternion.copy(params.quaternion);
        if (params.shadows.castShadow !== undefined) block.setCastShadow(params.shadows.castShadow);
        if (params.shadows.receiveShadow !== undefined) block.setReceiveShadow(params.shadows.receiveShadow);

        return block;

      } catch (error) {
        throw error;
      }
    }
    throw new PoolOutOfObjectsError('There is no instance of block pool with key:' + key);
  }

  acquireBrick(brick: Brick, key: string): void {
    this.brickPoolMap.get(key).acquire(brick);
    brick.setPoolKey(key);
  }

  //  acquireBlock(block: Block, key: string): void{
  //   block.visible = false;
  //   const pool = <Object3DPool>this.brickPoolMap[key];
  //   const index = pool.acquire(block);
  //   block.setPoolKey(key);
  //   block.setPoolIndex(index);
  // }

  reacquireBrick(brick: Brick): void {
    const pool = this.brickPoolMap.get(brick.getPoolKey());
    pool.reacquire(brick.uuid);
  }

  reacquireBlock(block: Block): void {
    const pool = this.blockPoolMap.get(block.getPoolKey());
    pool.reacquire(block.uuid);
  }


  private createVector3Pool(size: number, maxSize?: number): ObjectPool<Vector3> {
    const vector3 = new Vector3();
    const pool = new ObjectPool<Vector3>();
    pool.acquire(vector3);
    for (let i = 1; i < size; i++) {
      pool.acquire(vector3.clone());
    }
    return pool;
  }


  private createGroupPool(size: number, maxSize?: number): ObjectPool<Group> {
    const group = new Group();
    const pool = new ObjectPool<Group>();
    pool.acquire(group);
    for (let i = 1; i < size; i++) {
      pool.acquire(group.clone());
    }
    return pool;
  }


  private createBrick(config: BrickConfig): Brick {
    const geometries = this.geometries.get(config.geometryIndex);
    const materials = new Array();

    for (let matParams of config.materialsParams) {
      matParams.side = FrontSide;
      materials.push(this.getMaterial(matParams));
    }

    const brick = new Brick({ geometries, materials });

    // brick.castShadow = true;
    // brick.receiveShadow = true;

    const str = config.geometryIndex + ' ' +
      (brick.getPrimaryMaterial()).name + ' ' +
      (brick.getSecondaryMaterial()).name;

    const hash = SHA1(str).toString();
    brick.setPoolKey(hash);
    return brick;
  }


  private getMaterial(params: MeshPhongMaterialParameters): Material {
    const key = SHA1(JSON.stringify(params)).toString();
    if (this.materials.has(key)) {
      return this.materials.get(key);
    }
    params.name = key; 3
    const material = new MeshPhongMaterial(params);
    this.materials.set(key, material);
    return material;
  }


  private createBlock(type: BlockType, brickKey: string, isPivot?: boolean): Block {
    const bricks = [
      this.releaseBrick(brickKey),
      this.releaseBrick(brickKey),
      this.releaseBrick(brickKey),
      this.releaseBrick(brickKey)
    ];
    const block = new Block(type, bricks, isPivot);
    const hash = SHA1(type.index + brickKey + isPivot).toString()
    block.setPoolKey(hash);
    return block;
  }


  private brickPoolMap: Map<string, Object3DPool<Brick>>;
  private blockPoolMap: Map<string, Object3DPool<Block>>;
  // private planePoolMap: Map<string, Brick>;
  private groupPool: ObjectPool<Group>;
  private vector3Pool: ObjectPool<Vector3>;
  private materials: Map<string, Material>;

  private vbrickMaterial: MeshBasicMaterial;
  private vbrickGeometry: BoxBufferGeometry;
  private geometries: GeometryLoader;

}


export class Object3DPool<T> {

  constructor(private maxSize?: number) {
    this.locked = new Array();
    this.unlocked = new Array();
  }


  getSize(): number {
    return this.locked.length + this.unlocked.length;
  }


  getLockedSize(): number {
    return this.locked.length;
  }


  getUnlockedSize(): number {
    return this.unlocked.length;
  }


  /**
   * @throws {PoolMaxSizeReachedError}
   */
  acquire(object: Object3D): void {
    if (this.maxSize && this.getSize() === this.maxSize) {
      throw new PoolMaxSizeReachedError();
    }

    this.resetObject(object);
    this.unlocked.push(object);
  }


  reacquire(uuid: string): void {

    for (let i = 0; i < this.locked.length; i++) {
      if (this.locked[i].uuid === uuid) {
        this.resetObject(this.locked[i]);
        this.unlocked.push(this.locked[i]);
        this.locked.splice(i, 1);
        return;
      }
    }

    for (let i = 0; i < this.unlocked.length; i++) {
      if (this.unlocked[i].uuid === uuid) {
        return;
      }
    }

    throw new PoolObjectNotFound();

  }


  /**
   * @throws {PoolOutOfObjectsError}
   */
  release(): Object3D {

    if (this.unlocked.length === 0) {
      throw new PoolOutOfObjectsError();
    }

    const object = this.unlocked.pop();
    this.locked.push(object);

    object.visible = true;
    return object;
  }

  private resetObject(object: Object3D): void {
    object.visible = false;
    object.position.set(0, -1, 0);
    object.rotation.set(0, 0, 0);
  }


  disposeAll() {

    for (let object of this.locked.concat(this.unlocked)) {

      if (object.parent) {
        object.parent.remove(object);
      }

      object.traverse((child: any) => {
        if (child.geometry !== undefined) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });

    }

  }


  resetPool(): void {
    for (let object of this.locked) {
      this.resetObject(object);
      this.unlocked.push(object);
    }
    this.locked = new Array();
  }


  clearPool(): void {
    for (let object of this.locked) {
      object.parent.remove(object);
      this.reacquire(object.uuid);
    }
    this.unlocked = new Array();
    this.locked = new Array();
  }




  private locked: Array<Object3D>;
  private unlocked: Array<Object3D>;

}

export class ObjectPool<T> {

  private objects: Array<Object>;

  constructor(private maxSize?: number) {
    this.objects = new Array();
  }


  getSize(): number {
    return this.objects.length;
  }

  /**
   * @throws {PoolMaxSizeReachedError}
   */
  acquire(object: Object): void {
    if (this.maxSize && this.getSize() === this.maxSize) {
      throw new PoolMaxSizeReachedError();
    }
    this.objects.push(object);
  }


  /**
   * @throws {PoolOutOfObjectsError}
   */
  release(): Object {
    if (this.objects.length === 0) {
      throw new PoolOutOfObjectsError();
    }
    return this.objects.pop();
  }

}


export class PoolObjectNotFound extends Error {
  constructor(message: string = 'Object not found in pool.') {
    super(message);
  }
}


export class PoolOutOfObjectsError extends Error {
  constructor(message: string = 'There are no more ojects in pool.') {
    super(message);
  }
}


export class PoolMaxSizeReachedError extends Error {
  constructor(message: string = 'Pool have reached the maximum size.') {
    super(message);
  }
}


export interface IBrickShadowParams {
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export interface IReleaseBlockParams {
  position?: Vector3;
  quaternion?: Quaternion;
  shadows?: IBrickShadowParams;
}

