

export class Snapshot {

    constructor(
      public pointers: Array<number>,
      public time: number = new Date().getTime(),
      public hash?: string
    ) {
  
      if (!hash) {
        // TODO hash the pointers with the time
      }
    }
  
  }
  
  