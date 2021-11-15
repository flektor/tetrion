import { Component, HostListener } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { GameService } from './services/game/game.service';
import { GameStatus } from './engine/game.interface'; 

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private game: GameService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      document.addEventListener('contextmenu', event => event.preventDefault());

    });
  }

   ngOnDestory() {

        // API Call
    if (this.game.getStatus() !== GameStatus.Game) return;

     this.game.gameOver();
}

  @HostListener('window:beforeunload', ['$event'])
  async beforeUnloadHandler(event) {
    var confirmationMessage = "\o/";
 
    return false; 

    if (this.game.getStatus() !== GameStatus.Game) return;

    await this.game.gameOver();

  }
}