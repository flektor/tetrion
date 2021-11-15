import { GameCommand, GameCommands, GameOver, GamePoints } from "./commands";
import { GameConfig, GameMode, GameResult, GameStatus, IGameLoggerData, IPlayerGameStats } from 'src/app/engine/game.interface';
import { beautifyTime } from 'src/app/pages/replays/date-time-beauifier';


export class GameLogger {


  constructor(private data: IGameLoggerData) {
    this.indices = new Map();

    for (let item of data.logs) {
      this.indices.set(item[0], -1);
    }

  }

  getGameResult(username: string): GameResult.Win | GameResult.Loss | GameResult.None {

    if (this.data.mode === GameMode.Solo) return GameResult.None;

    return this.data.stats.get(username).result;

  }


  setGameConfig(config: GameConfig) {
    this.data.rows = config.rows;
    this.data.cols = config.cols;
    this.data.mode = config.mode;
  }


  getData(): IGameLoggerData {
    return this.data;
  }


  logCommand(username: string, command: GameCommand): void {
    this.data.logs.get(username).commands.push(command);
  }


  logPoints(username: string, points: GamePoints): void {
    this.data.logs.get(username).points.push(points);
  }


  getPlayersGameStats(): Map<string, IPlayerGameStats> {
    return this.data.stats;
  }


  getUsernames(): Array<string> {
    const usernames = new Array();

    for (let key of this.data.logs.keys()) {
      usernames.push(key);
    }
    return usernames;
  }




  // private addPoints(username: string, points: GamePoints): void | Sprite {

  //   const player = this.data.stats.get(username);
  //   player.experience += points.value;

  //   if (player.experience >= player.level * 350) {
  //     player.experience = player.experience - player.level * 350;
  //     player.level++;
  //   }

  // }


  // private levelUp(progress: IPlayerGameStats): Sprite {
  //   progress.experience = progress.experience - progress.level * 350;
  //   progress.level++;

  //   const falltime = this.data.initFallTime - progress.level * 100;

  //   if (falltime > 1500) {
  //     this.darta.setFallTime(falltime);
  //   }

  //   return {
  //     x: window.innerHeight / 4,
  //     text: "level " + player.level,
  //     opacity: 1
  //   };
  // }


  getCommands(username: string): Array<GameCommand> {
    return this.data.logs.get(username).commands;
  }


  getLastCommand(username: string): GameCommand {
    const index = this.data.logs.get(username).commands.length - 1;
    return this.data.logs.get(username).commands[index];
  }


  getFirstCommand(username: string): GameCommand {
    return this.data.logs.get(username).commands[0];
  }


  complete() {
    const commands: Array<GameCommand> = this.data.logs.entries().next().value[1].commands;

    const startTime: number = commands[0].time;
    const endTime: number = commands[commands.length - 1].time;
    this.data.duration = beautifyTime(endTime - startTime);


    for (let data of this.data.logs) {
      const commands = data[1].commands;
      this.recalculateTimes(commands);
      this.recalculateTimes(data[1].points);

      const playerResult = this.data.stats.get(data[0]);

      for (let points of data[1].points) {
        playerResult.score += points.value;
      }

      playerResult.level = Math.trunc(playerResult.score / 350) + 1;

      if (this.data.mode === GameMode.Solo) continue; 

      if (commands[commands.length - 1].type === GameCommands.GameOver) {
        playerResult.result = GameResult.Loss;
      } else {
        playerResult.result = GameResult.Win;
      }

    }

  }


  resetIndices(): void {
    for (let index of this.indices) {
      index[1] = -1;
    }
  }


  next(username: string): GameCommand {
    const commands = this.data.logs.get(username).commands;
    let index = this.indices.get(username);
    if (index < commands.length - 1) {
      return this.data.logs.get(username).commands[++index];
    }
  }


  private recalculateTimes(array?: Array<GamePoints> | Array<GameCommand>): void {

    if (array.length === 0 || array[0].time === 0) return;

    let startTime = array[0].time;

    for (let item of array) {
      item.time -= startTime;

    }
  }


  private indices: Map<string, number>;

}

