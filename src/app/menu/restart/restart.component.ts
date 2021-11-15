import { Component, HostListener } from '@angular/core';
import { AudioService } from 'src/app/services/audio/audio.service';
import { Router } from '@angular/router'; 
import { ModalController } from '@ionic/angular';
import { UserService } from 'src/app/services/user/user.service';
import { GameStatus } from 'src/app/engine/game.interface';
import { GameService } from 'src/app/services/game/game.service';

@Component({
  selector: 'app-restart',
  templateUrl: './restart.component.html',
  styleUrls: ['../menu.pages.scss'],
})
export class RestartComponent {

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.code === this.user.config.keys.back) {
      this.router.navigate([{ outlets: { menu: 'options' } }]);
    }
  }

  constructor(
    private router: Router,
    private game: GameService,
    public user: UserService,
    private modal: ModalController,
    public audio: AudioService
  ) { }


  public setRows(rows: number): void {
    this.user.config.game.rows = rows;
    this.user.updateGame();
  }
  public setCols(cols: number): void {
    this.user.config.game.cols = cols;
    this.user.updateGame();
  }


  public back() {
    this.router.navigate([{ outlets: { menu: 'options' } }]);
  }

  public apply() {
    this.game.restart();
    this.modal.dismiss({ dismissed: true });
  }
}
