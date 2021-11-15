import { Injectable } from '@angular/core';
import { UserService } from '../user/user.service';
import { Sounds } from './sounds.enum';
// import { NativeAudio } from '@ionic-native/native-audio';

declare var cordova;

@Injectable({ providedIn: 'root' })
export class AudioService {

  private sounds: any[] = [];

  private files = {
    path: "./assets/sounds/",
    samples: [
      { name: Sounds.Blast1, format: '.ogg', volume: 0.5 },
      { name: Sounds.Blast2, format: '.ogg', volume: 0.5 },
      { name: Sounds.Move, format: '.ogg', volume: 0.5 },
      { name: Sounds.Rotate, format: '.ogg', volume: 0.5 },
      { name: Sounds.Fall, format: '.ogg', volume: 0.5 },
      { name: Sounds.Click, format: '.ogg', volume: 1 },
      { name: Sounds.Check, format: '.ogg', volume: 0.5 },
    ]
  }

  constructor(private user: UserService) {

    // if (cordova!=undefined) {
    // 
    //     this.nativeAudio.preloadSimple('check', './assets/sounds/check.ogg');
    //     this.nativeAudio.preloadSimple('blast1', './assets/sounds/blast1.ogg').then(onSuccess, onError);

    // } else {
    this.init();

  }

  private async init() {
    await this.user.onSync();

    for (let sample of this.files.samples) {
      let filepath = this.files.path + sample.name + sample.format;
      this.loadSound(filepath, sample.name, sample.volume);
    }
  }

  public loadSound(path: string, id: Sounds, volume: number): void {
    let audio = new Audio();
    audio.src = path;
    audio.load();
    audio.volume = volume * this.user.config.audio.soundsVolume / 100;
    audio.id = id;
    this.sounds.push(audio);
  }

  public play(id: string, volume?: number): void {

    if (!this.user.config.audio.isSoundsEnabled) return;

    // if (cordova) {
    //   // this.nativeAudio.play(id).then(onSuccess, onError);
    //   this.nativeAudio.play(id);
    // } else {

    for (let sample of this.sounds) {
      if (sample.id !== id) continue;

      let audio = sample.cloneNode();
      if (volume) {
        audio.volume = volume * this.user.config.audio.soundsVolume / 100;
      } else {
        audio.volume = this.user.config.audio.soundsVolume / 100;
      }
      audio.play();
      return;
      // }
    }

  }

}


