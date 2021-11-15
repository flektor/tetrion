import { Component, ComponentFactoryResolver, ElementRef, Injector, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AlertController, ModalController } from '@ionic/angular';
import { FcmService } from 'src/app/services/fcm/fcm.service';
import { UserService } from 'src/app/services/user/user.service';
import { PeerService, GameRequestType } from 'src/app/services/peer/peer.service';
import { GameMode, IGameData, IPlayerInfo } from 'src/app/engine/game.interface';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { Tweens } from 'src/app/engine/tweens';
import { GameCommands, GameCountdown } from 'src/app/logger/commands';
import { OnlineStatus } from 'src/app/services/user/user.interface';
import { GameRulesEditorComponent } from 'src/app/components/game-rules-editor/game-rules-editor.component';
import { GameService } from 'src/app/services/game/game.service';
import { ThemeService } from 'src/app/services/theme/theme.service';
import { ThemeConfig } from 'src/app/services/theme/theme.interface';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { GameMessagingAction, GameType, ITempGameData, LobbySubscription } from './play-game.interface';

@Component({
  selector: 'play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss'],
})

export class PlayComponent implements OnInit, OnDestroy {

  @ViewChild('loginContainer',
    {
      static: false
    }) loginContainer: ViewContainerRef;
  // private loginContainer :ViewContainerRef;
  // @ViewChild('loginContainer',
  //   { read: ViewContainerRef , 
  //     static: false})
  // set container(container: ViewContainerRef) {
  //   if (container) {
  //     this.loginContainer = container;
  //   }
  // };

  public users: Array<any>;

  public isModeSolo: boolean = true;
  public onlineReady: boolean = false;
  public showLobby = false;
  public tempUsers = new Array();

  private isLoginPageLoaded: boolean = false;

  constructor(
    private aff: AngularFireFunctions,
    private afm: AngularFireMessaging,
    private modalCtrl: ModalController,
    public user: UserService,
    public fcm: FcmService,
    private peer: PeerService,
    private alertController: AlertController,
    private game: GameService,
    private theme: ThemeService,
    private router: Router,

    private cfr: ComponentFactoryResolver,
    private injector: Injector

  ) { }

  waitToVerify: boolean = true;
  searchingForQuickGame: boolean = false;
  quickGameButtonText: string = 'Find Game';


  ionViewDidEnter(): void {
    this.setMode({ detail: { value: this.user.config.game.mode } } as CustomEvent);
  }




  async ngOnInit() {
    // await this.user.onSync();
    console.log(this.loginContainer)
    await this.theme.loadPresetThemeConfigs();

    this.users = new Array();

  }


  async ngOnDestroy(): Promise<void> {
    // this.users = null;
    // this.user = null; 
    // this.fcm.deleteToken(); 

    this.peer.disconnect();
  }



  async lazyLoginPage() {
    if (this.isLoginPageLoaded) {
      return;
    }

    const { LoginPage } = await import('src/app/pages/login/login.page');
    const factory = this.cfr.resolveComponentFactory(LoginPage)
    const instance = this.loginContainer.createComponent(factory, null, this.injector);
    // instance.question = this.question;
    this.isLoginPageLoaded = true;

  }

  private waitForSoloGame: boolean = false;

  async play(gameData?: IGameData) {

    this.waitForSoloGame = true;
    if (!gameData) {
      gameData = await this.getSoloGameData();
    }

    await this.game.restart(gameData);

    this.waitForSoloGame = false;
  }


  onPlayButtonClicked() {


    this.isModeSolo ? this.play() : this.quickGame();
  }


  get gameMode(): typeof GameMode {
    return GameMode;
  }


  async setMode(event: CustomEvent) {

    switch (event.detail.value) {
      case GameMode.Solo:

        if (this.isModeSolo) return;

        this.onlineReady = false;

        this.isModeSolo = true;
        this.user.updateOnlineStatus(OnlineStatus.None);
        if (this.user.config.isSubbedInLobby) {
          await this.aff.httpsCallable('unsubscribeFromLobby')({
            token: this.user.config.fcm.token
          }).toPromise();

          this.user.config.isSubbedInLobby = false;
          this.users = new Array();
        }
        this.fcm.deleteToken();
        break;


      case GameMode.OneVsOne:

        if (!this.isModeSolo) return;

        this.isModeSolo = false;

        if (this.user.config.isGuest) {
          this.lazyLoginPage();
          return;
        }

        await this.peer.requestId();
        await this.fcm.requestPermission();

        console.log('resloved')

        this.afm.onMessage(message => this.onMessage(message));
        try {
          await this.aff.httpsCallable('subscribeToLobby')({
            token: this.user.config.fcm.token
          }).toPromise();

          this.user.config.isSubbedInLobby = true;
          await this.user.updateOnlineStatus(OnlineStatus.Lobby);
          this.updateUsers();

          this.onlineReady = true;

          break;

        } catch (error) {
          console.error(console.error);
          return;
        }
      default: return;

    }

    this.game.setMode(event.detail.value);
    this.user.config.game.mode = event.detail.value;
    this.user.updateMode();
  }

  searchPlayer(event: CustomEvent) {

    const hadTempUsers: boolean = this.tempUsers.length > 0 ? true : false;

    for (let user of this.tempUsers) {
      this.users.push(user);
    }

    this.tempUsers = new Array();

    if (event.detail.value.trim() === '') {
      if (hadTempUsers) {
        this.users.sort(this.compare);
      }
      return;
    }

    const users = new Array();

    for (let user of this.users) {
      if ((user.username as string).startsWith(event.detail.value)) {
        users.push(user);
        continue;
      }
      this.tempUsers.push(user);
    }

    users.sort(this.compare);
    this.users = users;

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


  doShowLobby() {

    this.showLobby = !this.showLobby;
    if (!this.showLobby && this.tempUsers.length > 0) {
      for (let user of this.tempUsers) {
        this.users.push(user);
      }
      this.tempUsers = new Array();
      this.users.sort(this.compare);
    }
  }


  private updateUsers() {

    this.aff.httpsCallable('getPlayersInLobby')({}).subscribe((data => {
      for (let user of data) {
        if (user.username !== this.user.username) {
          console.log(user.username, this.user.username)
          this.users.push(user);
        }
      }
      this.users.sort(this.compare);
    }));

  }

  private gameData: ITempGameData;


  private async openOutcomingConnection(data: any) {

    if (data.gameData) {
      this.gameData = JSON.parse(data.gameData) as ITempGameData;
      // console.log('Game Found. ');

      this.quickGameButtonText = 'Game Found';

      this.user.updateOnlineStatus(OnlineStatus.Signaling, this.gameData.gameId);

      const obs = await this.peer.connect({
        username: this.gameData.player.username,
        id: this.gameData.player.signal
      });

      this.peerSubscribe(this.gameData.player.username, obs);

      await this.aff.httpsCallable('outcomingConnectionOpened')({
        gameId: this.gameData.gameId,
        username: this.user.username
      }).toPromise();

    }

    const obs = await this.peer.connect({
      username: this.gameData.player.username,
      id: this.gameData.player.signal
    });

    this.peerSubscribe(this.gameData.player.username, obs);

    this.waitToVerify = true;


    this.peer.send(this.gameData.player.username, {
      type: GameMessagingAction.VerifingConnectionRequest,
      gameId: this.gameData.gameId
    });

  }

  getOpponentTheme(config: ThemeConfig): ThemeConfig {
    const themeName = this.user.config.theme.opponentTheme;

    if (!themeName) {
      return this.theme.loadThemeByName('red');
    }

    if (themeName !== "Player's Default") {
      return this.theme.loadThemeByName(themeName);
    }

    if (!config.custom) {
      return this.theme.loadThemeByName(config.name);
    }

    return config;

  }


  private async startGameRequest(data: any) {
    if (data.gameData) {

      this.quickGameButtonText = 'Starting';

      const gameData = JSON.parse(data.gameData) as { gameId: string, player: { theme: ThemeConfig } };

      this.gameData.player.theme = this.getOpponentTheme(gameData.player.theme)

    }

    this.peer.send(this.gameData.player.username, {
      type: GameMessagingAction.StartGameRequest,
      gameId: this.gameData.gameId
    });

  }


  private async waitForServer(data: any) {
    this.gameData = JSON.parse(data.gameData) as ITempGameData;

    this.user.updateOnlineStatus(OnlineStatus.Signaling, this.gameData.gameId);

    this.quickGameButtonText = 'Game Found';

  }


  private async waitForClient(data: any) {
    const gameData = JSON.parse(data.gameData) as { gameId: string, player: { theme: ThemeConfig } };

    this.gameData.player.theme = this.getOpponentTheme(gameData.player.theme);

    this.quickGameButtonText = 'Signaling';

    // console.log('Signaling. Waiting for Client..');
  }
 

  private playerJoinedLobby(data: any) {

    for (let user of this.users) {
      if (this.user.username === data.username
        || user.username === data.username
      ) {
        return;
      }
    }
 
    if (data instanceof Array) {
      for (let user of data) {
        if (this.user.username !== user.username) {
          this.users.push(user);
        }
      }
    } else if (data.username !== this.user.username) {
      this.users.push(data);
    }

  }


  private playerLeftLobby(data: any) {

    let index: number = 0;
    for (let user of this.users) {
      if (user.username === data.username) {
        this.users.splice(this.users.indexOf(index), 1);
        return;
      }
      index++;
    }
  }


  private chooseGameMessagingAction(data: any) {

    console.log(data)

    switch (data.action) {

      case GameMessagingAction.OpenOutcomingConnectionRequest:
        return this.openOutcomingConnection(data);

      case GameMessagingAction.StartGameRequest:
        return this.startGameRequest(data);

      case GameMessagingAction.WaitForServer:
        return this.waitForServer(data);

      case GameMessagingAction.WaitForClient:
        return this.waitForClient(data);
    }

  }


  private onMessage(message: any) {

    console.log(message)

    switch (message.data.type) {

      case GameType.QuickGame:
      case GameType.ChallengeGame:
        return this.chooseGameMessagingAction(message.data);

      case GameRequestType.GameChallenge:
        return this.gameChallenged(message.data);

      case GameRequestType.ChallengeDeclined:
        return this.challengeDeclined(message.data);

      case GameRequestType.ChallengeAccepted:
        return this.challengeAccepted(message.data);

      case LobbySubscription.PlayerJoined:
        return this.playerJoinedLobby(message.data);

      case LobbySubscription.PlayerLeft:
        return this.playerLeftLobby(message.data);
    }
  }


  private peerSubscribe(username: string, obs: Observable<any>) {


    obs.subscribe(async (data: any) => {

      console.log(data)

      if (data.gameId !== this.gameData.gameId) {
        console.log('Game id mismatch!');
        return;
      }

      switch (data.type) {

        case GameMessagingAction.GameCommand:
          // the game is running

          this.game.followCommand(username, data.command);
          return;

        // the game is not ready yet 

        case GameMessagingAction.VerifingConnectionRequest:
          this.quickGameButtonText = 'Verifing';
          this.peer.send(this.gameData.player.username, {
            type: GameMessagingAction.VerifingConnectionResponse,
            gameId: data.gameId,
            passphrase: this.gameData.passphrase,
            time: new Date().getTime(),
          });

          return;

        case GameMessagingAction.VerifingConnectionResponse:

          this.quickGameButtonText = 'Verifing';

          this.aff.httpsCallable('connectionEstablished')({
            gameId: data.gameId,
            username: this.user.username,
            passphrase: data.passphrase,
          }).toPromise();

          return;

        case GameMessagingAction.StartGameRequest:

          this.quickGameButtonText = 'Starting';

          this.gameData.indices = this.game.genarateIndices(10);

          this.peer.send(this.gameData.player.username, {
            type: GameMessagingAction.GameCountdown,
            indices: this.gameData.indices,
            gameId: data.gameId,
            time: new Date().getTime()
          });

          this.waitToVerify = false;

          const gameData1 = await this.getOneVsOneGameData();
          const countdown1 = 1000;

          await Tweens.timeout(countdown1).then(() => {
            this.user.updateOnlineStatus(OnlineStatus.InGame);
            this.play(gameData1);
          });


          return;

        case GameCommands.GameCountdown:

          if (this.alert) {
            this.alert.dismiss();
            this.alert = undefined;
          }

          this.waitToVerify = false;
          console.error("TODO consider time zone");

          this.gameData.indices = data.indices;

          const gameData2 = await this.getOneVsOneGameData();
          const countdown = 1000 - (new Date().getTime() - (data as GameCountdown).time);

          Tweens.timeout(countdown).then(() => {
            this.user.updateOnlineStatus(OnlineStatus.InGame);
            this.play(gameData2);
          });

          return;

        // case GameCommands.Connected:
        //   console.log("CONNECTED");
        //   return;



      }

    });
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

  private async getOneVsOneGameData(): Promise<IGameData> {

    const blockTypes = await this.game.getBlockTypes();
    const playersInfo: IPlayerInfo[] = new Array();

    playersInfo.push({
      username: this.user.username,
      theme: this.theme.loadThemeByName(this.user.config.theme.active),
      level: 1,
      experience: 0,
      levelExperience: 350
    });
    playersInfo.push({
      username: this.gameData.player.username,
      theme: this.gameData.player.theme,
      level: 1,
      experience: 0,
      levelExperience: 350
    });

    return {
      rows: this.gameData.rows,
      cols: this.gameData.cols,
      mode: GameMode.OneVsOne,
      gameId: this.gameData.gameId,
      playersInfo: playersInfo,
      blockTypes: blockTypes,
      indices: this.gameData.indices
    };

  }


  challengePlayer(username: string): void {
    this.aff.httpsCallable('challengePlayerRequest')({
      type: GameRequestType.GameChallenge,
      username1: this.user.username,
      username2: username
    }).toPromise();
  }


  viewProfile(username: string) {
    this.game.goToProfileView();
    this.router.navigate(['/profile'], { queryParams: { username: username } });
  }


  async quickGame(): Promise<void> {

    if (this.waitForSoloGame) return;

    if (this.searchingForQuickGame) {
      await this.quickGameRequest;

      if (this.user.config.onlineStatus === OnlineStatus.Signaling) {
        return;
      }

      this.user.updateOnlineStatus(OnlineStatus.Lobby);
      this.searchingForQuickGame = false;
      this.quickGameButtonText = 'Find Game';
      return;
    }

    this.searchingForQuickGame = true;
    this.quickGameButtonText = 'Searching';

    this.user.updateOnlineStatus(OnlineStatus.QuickGame);
    this.quickGameRequest = this.aff.httpsCallable('quickGameRequest')({
      type: GameRequestType.QuickGame,
      username: this.user.username,
      signal: this.user.config.peer.signal
    }).toPromise();
  }


  private async gameChallenged(data: any) {
    const alert = await this.alertController.create({
      header: `${data.username1} challenged you`,
      buttons: [{
        text: 'Decline',
        role: 'cancel',
        cssClass: 'secondary',
        handler: () => {
          this.aff.httpsCallable('challengePlayerRequest')({
            type: GameRequestType.ChallengeDeclined,
            username1: this.user.username,
            username2: data.username1
          }).toPromise();
        }
      }, {
        text: 'Accept',
        handler: () => {
          this.aff.httpsCallable('challengePlayerRequest')({
            type: GameRequestType.ChallengeAccepted,
            username1: this.user.username,
            username2: data.username1,
            // signal: this.user.config.peer.signal
          }).toPromise();
        }
      }]
    });
    await alert.present();
  }

  private alert: HTMLIonAlertElement;

  private async challengeAccepted(data: any) {
    this.alert = await this.alertController.create({
      header: "Challenge Accepted",
      subHeader: "signaling with " + data.username1,
    });

    await this.alert.present();



    await this.aff.httpsCallable('challengePlayerRequest')({
      type: GameRequestType.GameSignaling,
      username1: this.user.username,
      username2: data.username1,
      // signal: this.user.config.peer.signal
    }).toPromise();


    // await this.peer.connect({
    //   username: data.username1,
    //   id: data.signal
    // });

    // this.waitToVerify = true;
    // // this.peerSubscribe(data.username1);
    // alert.dismiss();
  }


  async challengeDeclined(data: any): Promise<void> {
    const alert = await this.alertController.create({
      header: "Challenge Declined",
      subHeader: `by ${data.username1}`,
      buttons: [{
        text: 'Close',
        role: 'cancel',
        cssClass: 'secondary'
      }]
    });
    await alert.present();
  }


  private compare(a: any, b: any): number {
    // src: https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
    if (a.username < b.username) {
      return -1;
    }
    if (a.username > b.username) {
      return 1;
    }
    return 0;
  }

  private quickGameRequest: Promise<any>;
}

