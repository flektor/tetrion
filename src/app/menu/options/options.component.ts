import { Component, HostListener } from '@angular/core';
import { AudioService } from 'src/app/services/audio/audio.service';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user/user.service';
import { GameService } from 'src/app/services/game/game.service';
import { GameStatus } from 'src/app/engine/game.interface';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss', '../menu.pages.scss'],
})
export class OptionsComponent {

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.code === this.user.config.keys.back) {
      this.resume();
    }
  }

  constructor(
    public audio: AudioService,
    private router: Router,
    private modal: ModalController,
    private user: UserService,
    public game: GameService
  ) { }

  public navigate(url: string) {
    this.router.navigate([{ outlets: { menu: url } }]);
  }

  public resume() {
    this.modal.dismiss({ 'dismissed': true });
  }


  restart() {
    if (this.game.getStatus() === GameStatus.GameOver) {
      this.game.restart();
      this.modal.dismiss();
      return;
    }

    this.navigate('restart');
  }

  exit() {
    if (this.game.getStatus() === GameStatus.GameOver) {
      this.game.exitGame();
      this.modal.dismiss();
      return;
    }

    this.navigate('exit');
  }

}
