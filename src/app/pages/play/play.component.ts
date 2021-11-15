import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { UserService } from 'src/app/services/user/user.service';
import { GameMode, IGameData } from 'src/app/engine/game.interface';
import { GameRulesEditorComponent } from 'src/app/components/game-rules-editor/game-rules-editor.component';
import { GameService } from 'src/app/services/game/game.service';
import { ThemeService } from 'src/app/services/theme/theme.service';

@Component({
  selector: 'play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss'],
})

export class PlayComponent implements OnInit {

  @ViewChild('loginContainer',
    {
      static: false
    }) loginContainer: ViewContainerRef;
 
  
  constructor( 
    private modalCtrl: ModalController,
    public user: UserService, 
    private game: GameService,
    private theme: ThemeService, 

  ) { }
 
 
  async ngOnInit() {
    // await this.user.onSync(); 
    await this.theme.loadPresetThemeConfigs();


  }
 

  async play(gameData?: IGameData) {

    if (!gameData) {
      gameData = await this.getSoloGameData();
    }

    await this.game.restart(gameData);

  }
 

  async showGameRulesDialog(icon) {
    console.log({ icon })
    icon.name = 'settings'
    const modal = await this.modalCtrl.create({
      component: GameRulesEditorComponent,
      backdropDismiss: false,
      cssClass: 'auto-height',
    });

    modal.onWillDismiss().then(async () => {
      icon.name = 'settings-outline';
    });

    await modal.present();
  }


  private async getGameId(): Promise<string> {

    return this.user.config.isGuest
      ? 'guest-game'
      : await (async () => {
        const game = await this.game.requestNewGame({
          mode: GameMode.Solo,
          usernames: [this.user.username]
        });

        return game ? game.id : 'guest-game';
      })();
  }

  private async getSoloGameData(): Promise<IGameData> {


    return {
      rows: this.user.config.game.rows,
      cols: this.user.config.game.cols,
      mode: GameMode.Solo,
      gameId: await this.getGameId(),
      blockTypes: await this.game.getBlockTypes(),
      playersInfo: [{
        username: this.user.username,
        theme: this.theme.loadThemeByName(this.user.config.theme.active),
        level: 1,
        experience: 0,
        levelExperience: 350
      }],
    };

  }

}

