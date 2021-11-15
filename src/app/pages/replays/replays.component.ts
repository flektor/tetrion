import { Component, OnInit } from '@angular/core';
import { GameService } from 'src/app/services/game/game.service';
import { IGameData, IGameLoggerData, IGameReplayData, IPlayerGameStats } from 'src/app/engine/game.interface';
import { beautifyTime } from './date-time-beauifier';
import moment from 'moment';
import { GameLogs } from 'src/app/logger/commands';
import { ThemeService } from 'src/app/services/theme/theme.service';


@Component({
  selector: 'replays',
  templateUrl: './replays.component.html',
  styleUrls: ['./replays.component.scss'],
})


export class ReplaysComponent implements OnInit {

  displayTable = true;
  displayGraph = false;
  displayButtons = false;

  showXAxis = true;
  showYAxis = true;
  gradient = true;
  showLegend = true;
  showXAxisLabel = true;
  xAxisLabel = 'time';
  showYAxisLabel = true;
  yAxisLabel = 'points';
  timeline = false;
  rotateXAxisTicks = false;
  xAxisTickFormattingFn = this.xAxisTickFormatting.bind(this);

  autoScale = true;
  colorScheme = { domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA'] };
  results: Array<LineChartDate> = [];

  selected = new Array();
  rows = new Array();
  columns = [
    // { prop: 'mode' },
    { prop: 'score' },
    { prop: 'level' },
    { prop: 'board' },
    { prop: 'timer' },
    { prop: 'date' },
    // { prop: 'result' },
  ];

  historyLogs: IGameLoggerData[];


  xAxisTickFormatting(value) {
    this.xAxisTickcounter++;

    if (this.xAxisTickcounter === 5) {
      this.xAxisTickcounter = 0;
      return value + '';
    }
    return '';
  }

  constructor(
    private game: GameService,
    private theme: ThemeService
  ) {


  }


  async ngOnInit() {

    await this.game.onReady()

    this.restoreGameLogs();
  }


  ionViewDidEnter(): void {
    // when the user is in another page and resize, and come back in replays page
    // the table seems empty,it needs update, temp fix 
    if (!this.historyLogs) return;

    this.updateTableData(this.historyLogs);

    this.selected = [this.rows[0]];
    this.showTable();
  }


  showTable(): void {
    const index = this.updateSelectedLogs();

    this.updateGraphData(this.historyLogs[index].logs);

    this.displayGraph = false;
    this.displayButtons = false;
    this.displayTable = true;
  }


  showOverview(): void {
    const index = this.updateSelectedLogs();
    this.updateGraphData(this.historyLogs[index].logs);

    this.displayTable = false;
    this.displayButtons = false;
    this.displayGraph = true;
  }

  async watchAgain() {
    this.displayButtons = false;
    // this.game.resetLoggerIndices();
    const index = this.updateSelectedLogs();

    const gameLoggerData = this.historyLogs[index];
    const data = await this.getReplayGameData(gameLoggerData);

    await this.game.replay(data, 4000);
    this.displayButtons = true;
  }


  backToReplays() {
    this.game.goToReplaysView();
    this.showTable();
  }


  async getReplayGameData(gameLoggerData: IGameLoggerData): Promise<IGameReplayData> {

    const playersInfo = new Array();

    for (let data of gameLoggerData.logs.entries()) {
      playersInfo.push({
        username: data[0],
        theme: this.theme.loadThemeByName('default'),
      })
    }

    const gameData: IGameData = {

      rows: gameLoggerData.rows,
      cols: gameLoggerData.cols,
      mode: gameLoggerData.mode,

      playersInfo: playersInfo,
      gameId: gameLoggerData.gameId,
      blockTypes: await this.game.getBlockTypes()
    };
 
    return {
      gameData: gameData,
      gameLoggerData: gameLoggerData
    }
  }


  async watchReplay() {
    this.displayTable = false;
    this.displayGraph = false;

    const index = this.updateSelectedLogs();

    const gameLoggerData = this.historyLogs[index];
    const data = await this.getReplayGameData(gameLoggerData);

    const promise = this.game.replay(data, 4000);
    await this.game.updateStatus();
    await promise;

    this.displayButtons = true;
  }


  updateGraphData(map: Map<string, GameLogs>): void {

    this.results = new Array();

    for (let logs of map) {

      const data: LineChartDate = {
        name: logs[0],
        series: new Array(),
      }

      let score = 0;

      for (let points of logs[1].points) {
        score += points.value;
        data.series.push({ name: beautifyTime(points.time), value: score });
      }
      this.results.push(data);
    }
    this.results = [...this.results];

  }


  private restoreGameLogs(): void {
    this.historyLogs = this.game.restoreLogsInfo();
    if (this.historyLogs) {

      this.historyLogs[0].logs = this.game.restoreLogs(this.historyLogs[0].title);
      this.updateTableData(this.historyLogs);
    }
  }


  private updateTableData(logs: Array<IGameLoggerData>): void {
    this.rows = new Array();
    for (let gameData of logs) {

      const stats = gameData.stats.entries().next().value[1] as IPlayerGameStats;

      this.rows.push({
        mode: gameData.mode.toLowerCase(),
        score: stats.score,
        level: stats.level,
        result: stats.result.toLowerCase(),
        timer: gameData.duration,
        date: moment(gameData.date).format("D/M, H:mm"),
        board: gameData.rows + 'x' + gameData.cols
      });

    }
    this.selected.push(this.rows[0])
    this.rows = [...this.rows];

  }


  private updateSelectedLogs(): number {
    const index = this.rows.indexOf(this.selected[0]);

    if (!this.historyLogs[index].logs) {
      this.historyLogs[index].logs = this.game.restoreLogs(this.historyLogs[index].title);
    }
    return index;
  }


  private xAxisTickcounter = 0;

}

interface LineChartDate {
  name: string;
  series: Array<{ name: string, value: number }>;
}