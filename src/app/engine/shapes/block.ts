import { Group, Vector3, Vector2, Mesh } from 'three';
import { Brick } from './brick';

export class Block extends Group {

  public pivot: Group;

  private poolKey: string;
  private poolIndex: number;

  public constructor(
    public blockType: BlockType,
    public bricks: Brick[],
    isPivot1?: boolean
  ) {

    super();
    this.pivot = new Group();

    let index = 0;
    for (let i = 0; i < this.blockType.bitmap.length; i++) {
      for (let j = 0; j < this.blockType.bitmap[i].length; j++) {
        if (this.blockType.bitmap[i][j] > 0) {
          // let b = brick.duplicate();

          let b = this.bricks[index++];
          b.position.set(i, j, 0);
          this.pivot.add(b);
        }
      }
    }

    this.add(this.pivot);
    let x: number, y: number, z: number;

    if (isPivot1 && this.blockType.pivot1) {
      x = -this.blockType.pivot1.x;
      y = -this.blockType.pivot1.y;
    } else {
      x = -this.blockType.pivot.x;
      y = -this.blockType.pivot.y;
    }

    // if (this.blockType.bitmap.length % 2 == 0) {
    //   x -= 0.1;
    // }
    // if (this.blockType.bitmap[0].length % 2 == 0) {
    //   y -= 0.1;
    // }

    if (isPivot1) {
      z = 0;
    } else {
      z = 0.5;
    }

    this.pivot.position.set(x, y, z);
    this.pivot.updateMatrix(); // as needed

  }

  public setPoolIndex(index: number) {
    this.poolIndex = index;
  }

  public setPoolKey(key: string) {
    this.poolKey = key;
  }

  public getPoolKey(): string {
    return this.poolKey;
  }

  public getPoolIndex(): number {
    return this.poolIndex;
  }


  public matrixPositions(rows: number) {
    this.updateMatrixWorld();
    let arr = [];
    for (let brick of this.bricks) {
      let vec3 = new Vector3();
      vec3.setFromMatrixPosition(brick.matrixWorld);

      let x = rows - 1 - Math.floor(this.round(vec3.y));
      let y = Math.floor(vec3.x);

      arr.push({ x, y, z: vec3.z })
    }
    return arr;
  }

  // TODO MAKE AND IMPORT MODULE with round method
  private round(number: number): number {
    if (number % 1 == 0) return number;
    if (number % 1 < 0.5) return number - number % 1;
    else return number - number % 1 + 1;
  }

  setName(name: string): void {
    for (let brick of this.bricks) {
      // brick.body.name = name;
      brick.name = name;
    }
  }


  getPrimaryMaterial() {
    return (<Mesh>this.bricks[0].children[0]).material;
  }

  getSecondaryMaterial() {
    if (<Mesh>this.bricks[0].children[1]) {
      return (<Mesh>this.bricks[0].children[1]).material;
    }
    return (<Mesh>this.bricks[0].children[0]).material;
  }

  setCastShadow(isTrue: boolean): void {
    for (const brick of this.bricks) { 
      brick.setCastShadow(isTrue);
    }
  }

  setReceiveShadow(isTrue: boolean): void {
    for (const brick of this.bricks) {
      brick.setReceiveShadow(isTrue);
    }
  }

}

export interface BlockType {
  name: string;
  index: number;
  bitmap: Array<Array<number>>;
  pivot: Vector2;
  pivot1?: Vector2;
}

