import { Vector3 } from "three";

export class GameLogs {
  public readonly type = GameCommands.GameData;
  public commands: Array<GameCommand>;
  public points: Array<GamePoints>;

  constructor() {
    this.commands = new Array();
    this.points = new Array();
  }
}

export class GameCommand {
  type: GameCommands;
  time: number;
}

export interface GamePoints {
  value: number;
  time: number;
}

export class MoveBlock implements GameCommand, IMoveBlockParams {

  public readonly type = GameCommands.MoveBlock;
  public time: number;
  public action: MoveBlockAction;
  public startPos: Vector3;
  public endPos: Vector3;
  public duration: number;

  constructor(params: IMoveBlockParams) {
    this.time = new Date().getTime();
    this.action = params.action;
    this.startPos = params.startPos;
    this.endPos = params.endPos;
    this.duration = params.duration;
  }
}

export interface IMoveBlockParams {
  action: MoveBlockAction,
  startPos: Vector3,
  endPos: Vector3,
  duration: number
}

export class NextBlock implements GameCommand, INextBlockParams {

  public readonly type = GameCommands.NextBlock;
  public time: number;
  public index: number;
  public startPos: Vector3;
  public endPos: Vector3;
  public duration: number;

  constructor(params: INextBlockParams) {
    this.time = new Date().getTime();
    this.index = params.index;
    this.startPos = params.startPos;
    this.endPos = params.endPos;
    this.duration = params.duration;
  }
}

export interface INextBlockParams {
  index: number,
  startPos: Vector3,
  endPos: Vector3,
  duration: number

}

export class AddBlock implements GameCommand {
  public readonly type = GameCommands.AddBlock;
  public time: number;
  constructor(public index: number) {
    this.time = new Date().getTime();
  }
}

export class GameOver implements GameCommand {
  public readonly type = GameCommands.GameOver;
  public time: number;
  constructor() {
    this.time = new Date().getTime();
  }
}

export class CompletedRows implements GameCommand {
  public readonly type = GameCommands.CompletedRows;
  public time: number;
  constructor(params: CompletedRowsParams) {
    this.time = new Date().getTime();

  }
}

export class Connected implements GameCommand {
  public readonly type = GameCommands.Connected;
  public time: number;
  constructor() {
    this.time = new Date().getTime();
  }
}


export class IndicesRequest implements GameCommand {
  public readonly type = GameCommands.IndicesRequest;
  public time: number;

  constructor(public amount: number) {
    this.time = new Date().getTime();
  }
}


export class IndicesResponse implements GameCommand {
  public readonly type = GameCommands.IndicesResponse;
  public time: number;

  constructor(public indices: number[]) {
    this.time = new Date().getTime();
  }
}


export class GameCountdown implements GameCommand {
  public readonly type = GameCommands.GameCountdown;
  public time: number;
  constructor(public indices:number[]) {
    this.time = new Date().getTime();
  }
}

export interface CompletedRowsParams {
  rows: Array<number>;
  positions: Array<any>;
}


export enum GameCommands {
  CompletedRows = 'COMPLETED_ROWS',
  AddBlock = 'ADD_BLOCK',
  GameData = 'GAME_DATA',
  MoveBlock = 'MOVE_BLOCK',
  TurnBlock = 'TURN_BLOCK',
  NextBlock = 'NEXT_BLOCK',
  GameOver = 'GAME_OVER',
  Connected = 'GAME_CONNECTED',
  GameCountdown = 'GAME_COUNTDOWN',
  IndicesRequest = 'INDICES_REQUEST',
  IndicesResponse = 'INDICES_RESPONSE'
}

export enum MoveBlockAction {
  TurnLeft = 'TURN_LEFT',
  TurnRight = 'TURN_RIGHT',
  MoveLeft = 'MOVE_LEFT',
  MoveRight = 'MOVE_RIGHT',
  Fall = 'FALL',
}








