import { Brick } from './shapes/brick';

 export class Matrix extends Array<Array<Brick>> {

  constructor(
    private rows: number,
    private cols: number
  ) {
    super();
    for (let x = 0; x < this.rows; x++) {
      this.push(new Array(this.cols));
      for (let y = 0; y < this.cols; y++) {
        this[x][y] = null;
      }
    }
  }

  public getAvailableObjects(): Array<Brick> {
    const arr = new Array();
    for (let row of this) {
      for (let object of row) {
        if (object) {
          arr.push(object);
        }
      }
    }
    return arr;
  }

  public reset() : void {
    for (let x = 0; x < this.rows; x++) {
      for (let y = 0; y < this.cols; y++) {
        this[x][y] = null;
      }
    }
  }

}