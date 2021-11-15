import { Component, ViewChild, ElementRef, HostListener, ChangeDetectorRef, AfterViewInit, } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { skip } from 'rxjs/operators';
import { AudioService } from 'src/app/services/audio/audio.service';
import { MenuPage } from 'src/app/menu/menu.page';
import { HitPoints, Sprite } from 'src/app/components/sprites/sprite';
import { GameMode, GameResult, GameStatus, IPlayerGameStats, IPlayerInfo } from 'src/app/engine/game.interface';
import { GameService } from 'src/app/services/game/game.service';
import { UserService } from 'src/app/services/user/user.service';
import { Sounds } from 'src/app/services/audio/sounds.enum';
import { Tweens } from 'src/app/engine/tweens';
import { IScenarioData } from 'src/app/engine/scenario.interface';
import { EventProps } from 'src/app/offscreen-orbit-controls/offscreen-orbit-controls';
import { ThemeService } from '../services/theme/theme.service';

@Component({
  selector: 'scene',
  templateUrl: './scene.page.html',
  styleUrls: ['./scene.page.scss'],
})
export class ScenePage implements AfterViewInit {

  @ViewChild("nextScene") nextBlockStageCanvas: ElementRef<HTMLCanvasElement>;
  @ViewChild("scene") stageCanvas: ElementRef<HTMLCanvasElement>;
  @ViewChild("ui") uiElement: ElementRef;
  @ViewChild("statsjs") statsElement: ElementRef;

  settingsIndex: number = 0;
  hitPoints: HitPoints[];
  timer: number = 0;
  sprites: Sprite[] = new Array();

  height: number = window.innerHeight;
  width: number = window.innerWidth;


  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {

    // if (this.game.isPaused()) return;

    if (!this.user.config) return;

    switch (event.code) {

      case this.user.config.keys.fallDown: this.fall(100); return;

      case this.user.config.keys.turnLeft: this.turn(-1); return;

      case this.user.config.keys.turnRight: this.turn(1); return;

      case this.user.config.keys.moveLeft: this.move(-1); return;

      case this.user.config.keys.moveRight: this.move(1); return;

      case this.user.config.keys.back: this.menu(); return;
    }

  }


  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.game.setSize(window.innerWidth, window.innerHeight);
  }


  constructor(
    public modalController: ModalController,
    public audio: AudioService,
    private user: UserService,
    private game: GameService,
    private router: Router,
    private theme: ThemeService,
    public changeDetector: ChangeDetectorRef
  ) { }

  async ngAfterViewInit() {

    await this.theme.loadPresetThemeConfigs();

    const mochedData = await this.getMochedData();

    await this.game.initScenario(mochedData);

    this.showGameUI(false);

    this.game.setSize(window.innerWidth, window.innerHeight);

    this.game.initOrbitControls();

    this.addEventListener('pointermove', true);
    this.addEventListener('pointerup', true);

    for (let type of ['keydown', 'contextmenu', 'pointerdown', 'wheel', 'touchstart', 'touchend', 'touchmove']) {
      this.addEventListener(type);
    }

    this.players = this.game.getPlayersStats();
    this.player = this.players.entries().next().value[1];


    this.hitPoints = new Array();
    this.sprites = new Array();


    this.game.onPoints().pipe(skip(1)).subscribe(data => {

      if (data.username === this.user.username) {
        this.hitPoints.push(data.points);

        if (data.points.isMatrixClear) {
          this.sprites.push({
            x: window.innerHeight * 2 / 6,
            text: "All Clear",
            opacity: 1
          });
        }

      }


    });


    this.game.onLevel().pipe(skip(1)).subscribe(() => {
      this.sprites.push({
        x: window.innerHeight / 4,
        text: "level " + this.player.level,
        opacity: 1
      });
    })


    this.game.onEnterGame().pipe(skip(1)).subscribe(async () => {

      this.prevGameResult = '';

      this.players = this.game.getPlayersStats();
      this.player = this.players.entries().next().value[1];


      this.showGameUI(true);

      this.hitPoints = new Array();
      this.sprites = new Array();

      await this.addCountdownSprite();

      let didExit = false;

      this.game.onExitGame().then(async () => {
        didExit = true;
        this.prevGameResult = '';
        this.showGameUI(false);
      });

      this.game.onGameOver().then(async () => {

        if (didExit) return;

        const result = this.game.getGameResult(this.user.username);
        this.setGameOverSpriteText(result);

        this.showNextBlock(false);
        this.showActionButtons(false);
      });

    });



    this.game.onEnterReplay().pipe(skip(1)).subscribe(async () => {
      // this.showLevelBar(true);

      // this.hitPoints = new Array();
      // this.sprites = new Array();

      await this.addCountdownSprite();

      // this.game.onGameOver().then(() => this.showLevelBar(false));

    });

  }


  prevGameResult: string = '';

  setGameOverSpriteText(result: GameResult.Win | GameResult.Loss | GameResult.None): string {
    switch (result) {
      case GameResult.Win:
        this.prevGameResult = 'Victory';
        return;
      case GameResult.Loss:
        this.prevGameResult = 'Defeat';
        return;
      default:
        this.prevGameResult = 'Game Over';
    }

  }



  play(): void {
    this.game.play();
  }


  pause(): void {
    this.game.pause();
  }


  // async replay(data: IGameReplayData): Promise<void> {
  //   return this.game.replay(data, 4000);
  // }


  // async restart() {

  //   this.showGameUI(true);

  //   this.hitPoints = new Array();
  //   this.sprites = new Array();

  //   this.game.restart(); 
  //   await this.addCountdownSprite();

  // }


  async menu(): Promise<void> {
    const isTrue = this.modal || (this.game.getStatus() !== GameStatus.Game && this.game.getStatus() !== GameStatus.GameOver);

    if (isTrue) return;

    if (this.game.getMode() === GameMode.Solo) {
      this.pause();
    }

    this.audio.play(Sounds.Click);

    this.modal = await this.modalController.create({
      component: MenuPage,
      backdropDismiss: false,
      cssClass: 'auto-height',
    });

    this.modal.onWillDismiss().then(async () => {
      this.modal = null;
      await Tweens.timeout(200); // wait for the ion-modal transition animation
      this.router.navigate([{ outlets: { menu: null } }]);

      if (this.game.getMode() === GameMode.Solo) {
        this.play();
      }
    });

    return await this.modal.present();
  }


  removePointSprite(points: HitPoints): void {
    this.hitPoints.splice(this.hitPoints.indexOf(points), 1);
  }


  removeMessageSprite(sprite: Sprite): void {
    this.sprites.splice(this.sprites.indexOf(sprite), 1);
  }


  setUIConfig(uiConfig: UIConfig): void {
    this.uiConfig = uiConfig;
  }


  showLevelBar(isTrue: boolean): void {
    this.uiConfig.showLevelBar = isTrue;
  }


  showNextBlock(isTrue: boolean): void {
    this.uiConfig.showNextBlock = isTrue;
    this.changeDetector.detectChanges();
  }


  showActionButtons(isTrue: boolean): void {
    this.uiConfig.showActionButtons = isTrue;
  }


  showMenuButton(isTrue: boolean): void {
    this.uiConfig.showMenuButton = isTrue;
  }


  showGridHelper(isTrue: boolean): void {
    this.uiConfig.showGridHelper = isTrue;
  }


  enableDebugRenderer(isTrue: boolean): void {
    this.uiConfig.enableDebugRenderer = isTrue;
  }


  showGameUI(isTrue: boolean): void {
    this.showActionButtons(isTrue);
    this.showLevelBar(isTrue);
    this.showMenuButton(isTrue);
    this.showNextBlock(isTrue);
  }


  getScoreBarWidth() {
    if (!this.player) return;

    const barFullWidth = 128;
    const prevLevelExp = (this.player.level - 1) * 350;

    return barFullWidth * (this.player.experience - prevLevelExp) / (this.player.levelExperience - prevLevelExp);
  }


  async turn(direction: number) {
    if (this.game.getStatus() !== GameStatus.Game) return;

    this.game.turn(direction);


    this.audio.play(Sounds.Rotate);
  }


  async move(direction: number) {
    if (this.game.getStatus() !== GameStatus.Game) return;

    this.game.move(direction);

    this.audio.play(Sounds.Move);
  }


  async fall(time?: number) {
    if (this.game.getStatus() === GameStatus.Replays) return;

    this.game.fall(time);

    this.audio.play(Sounds.Fall);
  }


  private async addCountdownSprite(): Promise<void> {
    const sprite = {
      x: window.innerHeight / 4,
      text: "3",
      opacity: 1
    }


    this.sprites.push(sprite);

    const duration = 1000;
    await Tweens.timeout(duration);
    sprite.text = '2';
    await Tweens.timeout(duration);
    sprite.text = '1';
    await Tweens.timeout(duration);
    sprite.text = 'GO';
  }


  getEventProps(event: Event): EventProps {
    const eventProps: any = new Object();
    const props = [
      "clientX",
      "clientY",
      "deltaY",
      "keyCode",
      "touches",
      "pointerType",
      "button",
      "ctrlKey",
      "metaKey",
      "shiftKey"
    ];
    for (const key of props) {
      if (event[key] === false || event[key] === undefined) {
        continue;
      }
      eventProps[key] = event[key];
    }
    eventProps.type = event.type;
    return eventProps;
  }


  private addEventListener(type: string, parent: boolean = false) {
    document.addEventListener(type, event => {

      const eventProps = this.getEventProps(event);
      if (parent) {
        this.game.dispatchControlsParentEvent(eventProps);
        return;
      }
      this.game.dispatchControlsEvent(eventProps);

    }, false);
  }



  private async getMochedData(): Promise<IScenarioData> {

    return {
      useGameWorker: true,
      useCannonWorker: false,
      debugRenderer: false,

      stageCanvas: this.stageCanvas.nativeElement,
      nextBlockStageCanvas: this.nextBlockStageCanvas.nativeElement,
      videoConfig: this.user.config.video,

      gameData: {
        rows: this.user.config.game.rows,
        cols: this.user.config.game.cols,
        mode: GameMode.Solo,

        playersInfo: [{
          username: this.user.username,
          theme: this.theme.loadThemeByName(this.user.config.theme.active)
        }] as IPlayerInfo[],
        gameId: undefined,
        blockTypes: await this.game.getBlockTypes()
      }

    }


  }


  uiConfig: UIConfig = {
    showActionButtons: false,
    showLevelBar: false,
    showMenuButton: false,
    showNextBlock: true, // must be true in initialization
    showGridHelper: false,
    enableDebugRenderer: true,
  };

  player: IPlayerGameStats
  private players: Map<string, IPlayerGameStats>;
  private modal: HTMLIonModalElement;

}


export interface UIConfig {

  showLevelBar: boolean;

  showNextBlock: boolean;

  showActionButtons: boolean;

  showMenuButton: boolean;

  showGridHelper: boolean;

  enableDebugRenderer: boolean;

}


export interface UIConfigurator {

  setUIConfig(config: UIConfig): void;

  showLevelBar(isTrue: boolean): void;

  showNextBlock(isTrue: boolean): void;

  showActionButtons(isTrue: boolean): void;

  showMenuButton(isTrue: boolean): void;

  showGridHelper(isTrue: boolean): void;

  enableDebugRenderer(isTrue: boolean): void;

}