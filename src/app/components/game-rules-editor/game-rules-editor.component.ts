import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AudioService } from 'src/app/services/audio/audio.service';
import { GameService } from 'src/app/services/game/game.service';
import { UserService } from 'src/app/services/user/user.service';

@Component({
  selector: 'app-game-rules-editor',
  templateUrl: './game-rules-editor.component.html',
  styleUrls: ['./game-rules-editor.component.scss'],
})
export class GameRulesEditorComponent {

  private initRowsValue: number;
  private initColsValue: number;

  public minRows: number = 10;
  public maxRows: number = 20;
  public minCols: number = 7;
  public maxCols: number = 15;
  public rows: number;
  public cols: number;


  constructor(
    private user: UserService,
    private game: GameService,
    private modalCtrl: ModalController,
    public audio: AudioService
  ) {

    this.initRowsValue = this.game.getRows();
    this.initColsValue = this.game.getCols();
    this.rows = this.initRowsValue;
    this.cols = this.initColsValue;
  }

  public setRows(event: CustomEvent): void {
    const rows = Number.parseInt(event.detail.value);
    this.rows = rows;
    this.game.setRows(rows);
  }

  public setCols(event: CustomEvent): void {
    const cols = Number.parseInt(event.detail.value);
    this.cols = cols;
    this.game.setRows(cols);

  }

  back() {
    this.user.config.game.rows = this.initRowsValue;
    this.user.config.game.cols = this.initColsValue;
    this.game.setRows(this.initRowsValue);
    this.game.setCols(this.initColsValue);
    this.modalCtrl.dismiss();
  }

  apply() {
    this.user.config.game.rows = this.rows;
    this.user.config.game.cols = this.cols;
    this.game.setRows(this.rows);
    this.game.setCols(this.cols);
    this.user.updateGame();
    this.modalCtrl.dismiss();
  }


}
