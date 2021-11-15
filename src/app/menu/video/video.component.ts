import { Component, OnInit, ViewChild, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { AudioService } from 'src/app/services/audio/audio.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as clone from 'lodash.clonedeep';
import { UserService } from 'src/app/services/user/user.service';
import { VideoConfig } from 'src/app/services/user/user.interface';
import { GameService } from 'src/app/services/game/game.service';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['../menu.pages.scss'],
})

export class VideoComponent implements OnInit {

  @ViewChild('preview', { static: true }) canvasContainter: ElementRef;
  @ViewChild('container', { static: true }) containerRef: ElementRef;
  @ViewChild('color', { static: true }) colorRef: ElementRef;

  private tempVideo: VideoConfig;
  private isPopoverOpen: boolean = false;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    event.stopPropagation();

    if (this.isPopoverOpen) return;

    if (event.code === this.user.config.keys.back) {
      this.back();
    }
  }

  constructor(
    public router: Router,
    public route: ActivatedRoute,
    public audio: AudioService,
    public game: GameService,
    public user: UserService,
    public changeDetector: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.tempVideo = <VideoConfig>clone(this.user.config.video);
  }


  setAntialias(isTrue: boolean): void {
    if (isTrue === this.user.config.video.hasAntialias) return;
    this.user.config.video.hasAntialias = isTrue;
    this.game.setAntialias(isTrue);
  }


  setStatsVisible(isTrue: boolean): void {
    if (isTrue !== this.user.config.video.showStats) {
      this.user.config.video.showStats = isTrue;
      this.game.setStatsVisible(isTrue);
    }
  }


  setCastShadows(isTrue: boolean): void { 
    if (isTrue !== this.user.config.video.castShadows) {
      this.user.config.video.castShadows = isTrue;
      this.game.setCastShadows(isTrue);
    }
  }


  setReceiveShadows(isTrue: boolean): void {
    if (isTrue !== this.user.config.video.receiveShadows) {
      this.user.config.video.receiveShadows = isTrue;
      this.game.setReceiveShadows(isTrue);
    }
  }



  setFog(isTrue: boolean): void {
    if (isTrue !== this.user.config.video.hasFog) {
      this.user.config.video.hasFog = isTrue;
      this.game.setFog(isTrue);
    }
  }


  apply(): void {
    this.user.updateVideo();
    this.router.navigate([{ outlets: { menu: 'options' } }]);
  }

  back(): void {

    if (this.user.config.video.hasFog !== this.tempVideo.hasFog) {
      this.game.setFog(this.tempVideo.hasFog);
    }

    if (this.user.config.video.hasAntialias !== this.tempVideo.hasAntialias) {
      this.game.setAntialias(this.tempVideo.hasAntialias);
    }

    if (this.user.config.video.showStats !== this.tempVideo.showStats) {
      this.game.setStatsVisible(this.tempVideo.showStats);
    }

    if (this.user.config.video.castShadows !== this.tempVideo.castShadows) {
      this.game.setCastShadows(this.tempVideo.castShadows);
    }

    if (this.user.config.video.receiveShadows !== this.tempVideo.receiveShadows) {
      this.game.setReceiveShadows(this.tempVideo.receiveShadows);
    }

    this.changeDetector.detectChanges();

    this.router.navigate([{ outlets: { menu: 'options' } }]);

  }

}
