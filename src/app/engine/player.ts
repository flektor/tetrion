import { Group, Vector3, Vector2 } from "three";
import { Matrix } from "./matrix";
import { ThemeConfig } from '../services/theme/theme.interface';
import { Block } from './shapes/block';
import { Brick } from './shapes/brick';

export class Player {

  public tween: any;
  public tweenGroups: Array<Group>;

  public matrix: Matrix;
  public bricksInMatrix: number = 0;
  public board: Group;
  public cblocks: Group;

  public block: Block;
  public pblock: Block; // projected Block
  public vblock: Block; // vatilator Block // 
  public cblock: Block; // next scene Block // 

  public physicalBricks: Array<Brick>;

  private poolKeys: PlayerPoolKeys;

  public dropDirection: number = 1;

  constructor(
    public username: string,
    public theme: ThemeConfig,
    private rows: number,
    private cols: number,
    private position: Vector3,
    private rotation?: Vector3,
  ) {
    this.init(rows, cols);
  }

  private init(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.tweenGroups = new Array();

    this.physicalBricks = new Array();

    this.cblocks = new Group();
    this.board = new Group();
    this.board.position.copy(this.position)

    if (this.board.position.z < 0) {
      this.dropDirection = -1;
    }

    this.board.position.setX(-this.cols / 2);
  }


  updateGameConfig(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.board.position.setX(-this.cols / 2);
    this.matrix = new Matrix(rows, cols); 
  }


  public setTheme(theme: ThemeConfig) {
    this.theme = theme;
  }

  public getTheme(): ThemeConfig {
    return this.theme;
  }

  public printKeys(): void {
    console.log(this.poolKeys);
  }

  public getBrickKey(index: number): string {
    return this.poolKeys.brickKeys[index];
  }

  public getBlockKey(index: number): string {
    return this.poolKeys.blockKeys[index];
  }

  public getPBlockKey(index: number): string {
    return this.poolKeys.pblockKeys[index];
  }

  public getVBlockKey(index: number): string {
    return this.poolKeys.vblockKeys[index];
  }

  public getCBlockKey(index: number): string {
    return this.poolKeys.cblockKeys[index];
  }

  public setPoolKeys(keys: PlayerPoolKeys) {
    this.poolKeys = keys;
  }

  public isValidFall(vec3: Vector3): boolean {
    if (vec3.x > this.rows - 1) return false;

    if (vec3.y < 0 || vec3.y > this.cols - 1) return false;

    if (vec3.x >= 0 && this.matrix[vec3.x][vec3.y]) return false;

    return true;
  }

  public isValidMove(direction: number): boolean { 
    let y = this.block.position.y;
    //hardcoded
    if (this.vblock.blockType.pivot.y == 0.5
      && this.vblock.blockType.pivot.x == 0.5
      && y % 1 != 0
    ) {
      y = y - y % 1 - 1;

    } else if (y % 1 > 0) {
      y = y - y % 1;
    }

    this.vblock.position.set(this.block.position.x + direction, y, this.block.position.z);
    this.vblock.rotation.copy(this.block.rotation);
    const positions = this.vblock.matrixPositions(this.rows);

    for (let p of positions) {
      /// brick is not entered the stage yet
      if (p.x < 0) return true;

      if (p.x > this.rows - 1) return false;

      if (p.y < 0 || p.y > this.cols - 1) return false;

      if (this.matrix[p.x][p.y]) return false;
    }

    let pos = this.fallRaycast({ move: direction })
    let yy = this.block.position.y - pos.y;

    if (yy < 0) return false;

    return true;
  }


  public isValidRotate(direction: number): boolean {
    let p = this.block.position;
    let q = this.block.rotation;

    // let y = p.y;
    // if (y % 1 > 0 && y % 1 < 0.5) {
    //   y = y - y % 1 - 0.5;
    // } else if (y % 1 > 0.5) {
    //   y = y - y % 1 - 0.5;
    // }

    let y = p.y;

    if (y % 1 > 0) {
      y = y - y % 1 - 1;
    }

    this.vblock.position.set(p.x, y, p.z);
    this.vblock.rotation.set(q.x, q.y, q.z);
    this.vblock.rotateZ(direction * Math.PI / 2);

    let positions = this.vblock.matrixPositions(this.rows);

    for (let p of positions) {
      /// brick is not entered the stage yet
      if (p.x < 0) return true

      if (p.x > this.rows - 1) return false;

      if (p.y < 0 || p.y > this.cols - 1) return false;

      if (this.matrix[p.x][p.y]) return false;
    }

    let pos = this.fallRaycast({ rotate: direction });
    let yy = this.block.position.y - pos.y;

    if (yy < 0) return false;

    return true;
  }


  public fallRaycast(params?: { move?: number, rotate?: number }): Vector3 {

    const p = this.block.position;
    if (!params) {
      params = { move: 0 };
    } else if (!params.move) {
      params.move = 0;
    }

    this.vblock.position.set(p.x + params.move, p.y, p.z);
    this.vblock.rotation.copy(this.block.rotation);

    if (params.rotate) {
      this.vblock.rotateZ(params.rotate * Math.PI / 2);
    }


    const positions = this.vblock.matrixPositions(this.rows);
    const distance = this.fallRowsOneByOne(positions);
    let y = p.y;

    // karfwto  =(
    if (this.vblock.blockType.pivot.y == 0.5
      && this.vblock.blockType.pivot.x == 0.5) {
      y = this.round(y + 0.5) - distance;

    } else {
      y = this.round(y) + 0.5 - distance;
    }

    if (y == 0) {
      y = p.y % 1;
    }

    return new Vector3(p.x + params.move, y, p.z);
  }

  isTweening(): false | any {
    if (this.tween && this.tween.isPlaying()) {
      return this.tween;
    }
    return false;
  }

  private fallRowsOneByOne(array: Array<Vector3>, distance = 0): number {
    let isTrue = true;
    for (let item of array) {
      item.x++;
      if (!this.isValidFall(item)) {
        isTrue = false;
        break;
      }
    }

    if (isTrue) return this.fallRowsOneByOne(array, ++distance);

    return distance;
  }

  private round(number: number): number {
    if (number % 1 == 0) return number;
    if (number % 1 < 0.5) return number - number % 1;
    else return number - number % 1 + 1;
  }


  public checkRows(positions: Vector2[]): Array<number> {
    let rows = new Array();
    let checkedRows = new Array();

    for (let p of positions) {
      if (checkedRows.indexOf(p.x) > -1) continue;

      if (this.checkRow(p.x)) {
        rows.push(p.x);
      }
      checkedRows.push(p.x);
    }
    rows.sort((a, b) => b - a);
    return rows;
  }

  private checkRow(row: number): boolean {
    let count = 0;
    for (let y = 0; y < this.cols; y++) {
      if (!this.matrix[row][y]) break;
      count++;
    }
    if (count == this.cols) return true;
    return false;
  }

}

// export class CurrentPlayer extends Player { }

export interface PlayerPoolKeys {
  brickKeys: Array<string>;
  blockKeys: Array<string>;
  pblockKeys: Array<string>;
  vblockKeys: Array<string>;
  cblockKeys: Array<string>;
}