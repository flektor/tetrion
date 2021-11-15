import { Component, HostListener } from '@angular/core';
import { AudioService } from 'src/app/services/audio/audio.service';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { UserService } from 'src/app/services/user/user.service'; 
import { GameService } from 'src/app/services/game/game.service';

@Component({
  selector: 'app-exit',
  templateUrl: './exit.component.html',
  styleUrls: ['../menu.pages.scss'],
})
export class ExitComponent {

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.code === this.user.config.keys.back) {
      this.router.navigate([{ outlets: { menu: 'options' } }]);
    }
  }

  constructor(
    private router: Router,
    public audio: AudioService,
    public user: UserService,
    private modal: ModalController,
    private game: GameService
  ) {
  }

  public back() {
    this.router.navigate([{ outlets: { menu: 'options' } }]);
  }

  public async apply() {
    this.game.exitGame(); 
    this.modal.dismiss();
  }
}
