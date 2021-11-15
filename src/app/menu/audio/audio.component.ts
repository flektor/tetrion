import { Component, HostListener, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AudioService } from 'src/app/services/audio/audio.service';
import { Sounds } from 'src/app/services/audio/sounds.enum';
import { UserService } from 'src/app/services/user/user.service';
@Component({
  selector: 'app-audio',
  templateUrl: './audio.component.html',
  styleUrls: ['./audio.component.scss', '../menu.pages.scss'],
})
export class AudioComponent {

  private tempSoundsVolume: number;
  private tempMusicVolume: number;
  private tempMusicChecked: boolean;
  private tempSoundsChecked: boolean;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.code === this.user.config.keys.back) {
      this.back();
    }
  }

  constructor(
    private router: Router,
    private changeDetector: ChangeDetectorRef,
    public audio: AudioService,
    public user: UserService
  ) {
  }

  ngOnInit() {
    this.tempSoundsVolume = this.user.config.audio.soundsVolume;
    this.tempMusicVolume = this.user.config.audio.musicVolume;
    this.tempSoundsChecked = this.user.config.audio.isSoundsEnabled;
    this.tempMusicChecked = this.user.config.audio.isMusicEnabled;
  }

  public setMusicVolume(checked: boolean, volume?: number | { lower: number; upper: number; }) {
    this.user.config.audio.isMusicEnabled = checked;
    if (!checked) {
      this.user.config.audio.musicVolume = 0;
    } else {
      if (!volume) {
        volume = this.tempMusicVolume;
      }
      this.user.config.audio.musicVolume = volume as number;
      this.audio.play(Sounds.Check);
    }
    this.changeDetector.detectChanges();
  }

  public setSoundsVolume(checked: boolean, volume?: number | { lower: number; upper: number; }) {
    this.user.config.audio.isSoundsEnabled = checked;
    if (!checked) {
      this.user.config.audio.soundsVolume = 0;
    } else {
      if (!volume) {
        volume = this.tempSoundsVolume;
      }
      this.user.config.audio.soundsVolume = volume as number;
      this.audio.play(Sounds.Check);
    }
    this.changeDetector.detectChanges();
  }

  public back(): void {
    this.user.config.audio.isSoundsEnabled = this.tempSoundsChecked;
    this.user.config.audio.isMusicEnabled = this.tempMusicChecked;

    if (this.tempSoundsChecked) {
      this.user.config.audio.soundsVolume = this.tempSoundsVolume;
    } else {
      this.user.config.audio.soundsVolume = 0;
    }

    if (this.tempMusicChecked) {
      this.user.config.audio.musicVolume = this.tempMusicVolume;
    } else {
      this.user.config.audio.musicVolume = 0;
    }

    this.changeDetector.detectChanges();
    // this.done.next(false);
    this.router.navigate([{ outlets: { menu: 'options' } }]);

  }

  public apply(): void {
    this.tempSoundsChecked = this.user.config.audio.isSoundsEnabled;
    this.tempMusicChecked = this.user.config.audio.isMusicEnabled;
    this.tempSoundsVolume = this.user.config.audio.soundsVolume;
    this.tempMusicVolume = this.user.config.audio.musicVolume;
    this.changeDetector.detectChanges();

    this.user.updateAudio();
    this.router.navigate([{ outlets: { menu: 'options' } }]);
  }


}
