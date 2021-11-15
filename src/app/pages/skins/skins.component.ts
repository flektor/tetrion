import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AudioService } from 'src/app/services/audio/audio.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { ColorPickerComponent } from 'src/app/components/color-picker/color-picker.component';
import { GeometryPickerComponent } from 'src/app/components/geometry-picker/geometry-picker.component';
import { GameService } from 'src/app/services/game/game.service';
import { ThemeService } from 'src/app/services/theme/theme.service';
import { UserService } from 'src/app/services/user/user.service';
import { ThemeConfig } from 'src/app/services/theme/theme.interface';
import { Sounds } from 'src/app/services/audio/sounds.enum';
import { ThemeSaverPopoverComponent } from 'src/app/components/theme-saver-popover/theme-saver-popover.component';
import { ScreenPosition } from 'src/app/engine/scenario.interface';

@Component({
  templateUrl: './skins.component.html',
  styleUrls: ['./skins.component.scss'],
})
export class SkinsComponent implements OnInit {

  // @ViewChild('preview', { static: true }) canvasRef: ElementRef<HTMLCanvasElement>;; 
  // @ViewChild('color', { static: true }) colorRef: ElementRef;

  index: number = 3;
  tempTheme: ThemeConfig;

  isPopoverOpen = false;
  primaryColor: string | number = '';
  secondaryColor: string | number = '';
  permissions: 'public' | 'private' = 'private';
  themeName: string;
  opponentThemeName: string = "red";
  hasOpponentThemeChoosed: boolean = false;
  hasThemeChanged: boolean = false;
  hasThemeChoosed: boolean = false;
  hasThemeCopied: boolean = false;
  isCustomTheme: boolean = false;
  isSaveButtonEnabled: boolean = false;


  isNextBlockButtonHovered: boolean = false;
  isPrevBlockButtonHovered: boolean = false;


  arrowsPosition: ScreenPosition = { x: 0, y: 0 };


  private permissionsChanged: boolean = false;


  constructor(
    public router: Router,
    public route: ActivatedRoute,
    public audio: AudioService,
    public user: UserService,
    public game: GameService,
    public theme: ThemeService,
    private popCtrl: PopoverController,
    public changeDetector: ChangeDetectorRef
  ) {

  }


  async ngOnInit() {

    await Promise.all([
      this.game.onReady(),
      this.theme.loadPresetThemeConfigs()
    ]);


    const theme = this.theme.loadThemeByName(this.user.config.theme.active);

    if (this.user.config.theme.opponentTheme) {
      this.opponentThemeName = this.user.config.theme.opponentTheme;
    }

    this.tempTheme = JSON.parse(JSON.stringify(theme));
    this.themeName = this.tempTheme.name;
    this.isCustomTheme = this.tempTheme.custom;

    this.updateColors();

    this.changeDetector.detectChanges();
    this.hasThemeChoosed = false;


    window.onresize = () => {

      setTimeout(() => {
        this.game.getSkinArrowsPosition(this.index).then(arrowsPosition => {
          this.arrowsPosition = arrowsPosition;
          this.changeDetector.detectChanges();
        });
      }, 2000);
    }

    this.route.queryParams.subscribe((object: any) => {

      if (object.arrowsPosition) {
        this.arrowsPosition = JSON.parse(object.arrowsPosition);
        this.changeDetector.detectChanges();
      }


      if (!object.theme) return;

      let theme = JSON.parse(object.theme) as ThemeConfig;

      if (!theme.custom) {
        theme = this.theme.loadThemeByName(theme.name);
      }
      this.themeName = theme.name;
      this.tempTheme = theme;

      this.game.setTheme(theme);

      this.theme.saveCustomTheme(theme);

      this.updateColors();

      this.hasThemeCopied = true;
      this.isSaveButtonEnabled = true;
      this.isCustomTheme = theme.custom;





    });
  }

  setPermissions(permissions: 'public' | 'private'): void {
    if (this.tempTheme.permissions === permissions) return;

    this.permissions = permissions;
    this.tempTheme.permissions = permissions;
    this.permissionsChanged = true;
    this.isSaveButtonEnabled = true;
  }



  async save(): Promise<void> {

    if (!this.isSaveButtonEnabled) return;

    this.isSaveButtonEnabled = false;

    let doSave: boolean;

    if (this.hasThemeCopied) {
      this.hasThemeCopied = false;
      this.user.config.theme.active = this.tempTheme.name;
      doSave = true;
    }

    if (this.hasThemeChoosed) {
      this.hasThemeChoosed = false;

      this.user.config.theme.active = this.tempTheme.name;
      this.game.changePlayerTheme(this.user.username, this.tempTheme);
      this.user.updateTheme();
      // doSave = true;
      return;
    }

    // if (this.permissionsChanged) {
    //   this.permissionsChanged = false;
    //   this.user.config.theme.active = this.tempTheme.name;
    //   doSave = true;
    // }


    // if (this.opponentThemeName !== this.user.config.theme.opponentTheme) {
    //   this.user.config.theme.opponentTheme = this.opponentThemeName;
    //   this.user.config.theme.active = this.tempTheme.name;
    //   doSave = true;
    // }


    if (doSave) {
      this.theme.saveCustomTheme(this.tempTheme);
      this.game.changePlayerTheme(this.user.username, this.tempTheme);
      return;
    }

    const popover = await this.popCtrl.create({
      component: ThemeSaverPopoverComponent,
      translucent: true
    });

    popover.onDidDismiss().then(result => {

      if (result.data === undefined || !result.data.save) return;

      this.tempTheme.name = result.data.name;
      this.changeDetector.detectChanges();
      this.tempTheme.custom = true;
      this.isCustomTheme = true;
      this.tempTheme.permissions = this.permissions;
      this.theme.saveCustomTheme(this.tempTheme);

      this.game.changePlayerTheme(this.user.username, this.tempTheme);
      this.themeName = this.tempTheme.name;
    });
    return await popover.present();
  }


  setThemeName(name: string): void {
    this.themeName = name;
  }


  chooseOpponentTheme(event: CustomEvent): void {
    if (event.detail.value === this.opponentThemeName) return;
    this.opponentThemeName = event.detail.value;
    this.hasOpponentThemeChoosed = true;
    this.isSaveButtonEnabled = true;

  }


  chooseTheme(event: CustomEvent): void {
    if (event.detail.value === this.themeName) return;

    const theme = this.theme.loadThemeByName(event.detail.value);
    this.tempTheme = JSON.parse(JSON.stringify(theme));
    this.game.setTheme(theme);

    this.updateColors();

    this.hasThemeChoosed = true;
    this.isSaveButtonEnabled = true;
    this.isCustomTheme = this.tempTheme.custom;
  }


  pickPrimaryColor() {
    this.pickColor(0);
  }


  pickSecondaryColor() {
    this.pickColor(1);
  }


  async pickColor(index: number): Promise<void> {

    const popover = await this.popCtrl.create({
      component: ColorPickerComponent,
      translucent: true,
      componentProps: {
        color: this.tempTheme.bricks[this.index].materialsParams[index].color,
        // colors: this.tempTheme.colors
      }
    });

    popover.onDidDismiss().then(result => {
      this.isPopoverOpen = false;

      if (result.data !== undefined) {

        this.tempTheme.bricks[this.index].materialsParams[index].color = result.data;

        if (index === 0) {
          this.game.setThemePrimaryColor(result.data);
        } else if (index === 1) {
          this.game.setThemeSecondaryColor(result.data);
        }

        this.game.overrideΤhemeBlock(this.index);
        this.updateColors();
        this.hasThemeChanged = true;
        this.hasThemeChoosed = false;
        this.isSaveButtonEnabled = true;

      }
    });
    this.isPopoverOpen = true;
    return await popover.present();
  }


  async pickGeometry(): Promise<void> {

    const skinSize = 128;

    let columns = Math.floor(window.innerWidth / (skinSize - 5));
    let rows = Math.floor(window.innerHeight / (skinSize - 5));

    if (window.innerWidth < window.innerHeight) {
      const temp = rows;
      rows = columns;
      columns = temp;
    }


    const props = {
      skinSize: skinSize,
      columns: columns,
      rows: rows,
      materials: this.tempTheme.bricks[this.index].materialsParams
    };

    const popover = await this.popCtrl.create({
      component: GeometryPickerComponent,
      translucent: true,
      componentProps: props
    });

    popover.onDidDismiss().then(result => {

      this.isPopoverOpen = false;
      if (result.data === undefined) return;

      this.tempTheme.bricks[this.index].geometryIndex = result.data;
      this.game.setThemeBrickGeometry(result.data);

      this.hasThemeChanged = true;
      this.hasThemeChoosed = false;
      this.isSaveButtonEnabled = true;

    });

    this.isPopoverOpen = true;
    return await popover.present();

  }


  async nextBlock(): Promise<void> {

    if (!await this.game.nextΤhemeBlock()) return;

    this.index++;
    if (this.index == 7) {
      this.index = 0;
    }
    this.updateColors();

    this.audio.play(Sounds.Rotate);

  }


  async prevBlock(): Promise<void> {

    if (!await this.game.prevΤhemeBlock()) return;

    this.index--;

    if (this.index == -1) {
      this.index = 6;
    }
    this.updateColors();

    this.audio.play(Sounds.Rotate);

  }

  mouseEnteredNextButton(): void {
    this.isNextBlockButtonHovered = true;
  }



  mouseLeftNextButton(): void {
    this.isNextBlockButtonHovered = false;
  }


  mouseEnteredPrevButton(): void {
    this.isPrevBlockButtonHovered = true;
  }


  mouseLeftPrevButton(): void {
    this.isPrevBlockButtonHovered = false;
  }


  getPrevBlockClassName(): string {
    let classnames = 'grid-button prev-button';

    // classnames = this.adjustGridButtonMinHeight(classnames);

    if (this.isPrevBlockButtonHovered) {
      classnames += ' hovered-grid-button';
    }

    return classnames;
  }


  getNextBlockClassName(): string {
    let classnames = 'grid-button next-button';

    // classnames = this.adjustGridButtonMinHeight(classnames);

    if (this.isNextBlockButtonHovered) {
      classnames += ' hovered-grid-button';
    }

    return classnames;
  }


  // private adjustGridButtonMinHeight(classnames: string): string {
  //   const aspect = window.innerWidth / window.innerHeight;

  //   // if (aspect < 1) {
  //   //   return classnames ;
  //   // }

  //   if (aspect < 1.2) {
  //     return classnames += ' grid-button-min-height-40vh';
  //   }

  //   return classnames += ' grid-button-min-height-50vh';
  // }


  getGridContainerClassName(): string {

    if (window.innerWidth / window.innerHeight > 1.2) {
      return 'grid-container margin-top-5vh';
    }
    return 'grid-container margin-top-20vh';
  }


  getThemeEditorClassName(): string {

    if (window.innerWidth / window.innerHeight > 1.2) {
      return 'theme-editor side-theme-editor';
    }

    return 'theme-editor bottom-theme-editor';
  }


  private updateColors(): void {
    this.primaryColor = this.tempTheme.bricks[this.index].materialsParams[0].color as string;
    this.secondaryColor = this.tempTheme.bricks[this.index].materialsParams[1].color as string;
  }


}
