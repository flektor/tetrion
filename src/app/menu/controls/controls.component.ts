import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { AudioService } from 'src/app/services/audio/audio.service';
import { Router } from '@angular/router';
import { LoaderService } from 'src/app/loader/loader.service';
import { UserService } from 'src/app/services/user/user.service';
import { KeysConfig } from 'src/app/services/user/user.interface';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss', '../menu.pages.scss'],
})
export class ControlsComponent implements OnInit {

  public tempKeys: KeysConfig;
  private activeElem: HTMLElement;

  constructor(
    private router: Router,
    public audio: AudioService,
    public changeDetector: ChangeDetectorRef,
    private user: UserService,
    private loader: LoaderService
  ) { }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    event.stopPropagation();
    this.onKeyDown(event);
    if (event.code === this.user.config.keys.back) {
      this.back();
    }
  }


  ngOnInit(): void {
    this.tempKeys = this.cloneKeys(this.user.config.keys);
  }

  private cloneKeys(keys: KeysConfig): KeysConfig {
    const tempKeys = new Object() as KeysConfig;
    for (let key of Object.keys(keys)) {
      tempKeys[`${key}`] = keys[`${key}`]
    }
    return tempKeys;
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.activeElem) return;

    const pattern: RegExp = /^([a-zA-Z]+\s)*[a-zA-Z]+$/;

    if (pattern.test(event.code)) {

      for (let key of Object.keys(this.tempKeys)) {
        if (this.tempKeys[`${key}`] === event.code) {
          this.tempKeys[`${key}`] = "";
          break;
        }
      }
      console.log(this.activeElem.getAttribute("id"))
      this.tempKeys[`${this.activeElem.getAttribute("id")}`] = event.code;
      this.changeDetector.detectChanges();
      this.activeElem.classList.remove("focused");
      this.activeElem = null;
    }
  }

  public activate(elementRef: HTMLElement) {
    if (this.activeElem) {
      this.activeElem.classList.remove("focused");
      const id = this.activeElem.getAttribute("id");
      this.tempKeys[`${id}`] = this.user.config.keys[`${id}`];
    }

    this.activeElem = elementRef;
    this.tempKeys[`${elementRef.getAttribute("id")}`] = "";
    this.activeElem.classList.add("focused");
    this.changeDetector.detectChanges();
  }

  public async resetKeys(): Promise<void> {
    if (this.activeElem) {
      this.activeElem.classList.remove("focused");
      this.activeElem = null;
    }

    const object = await this.loader.loadJson("assets/default-user-config.json");
    this.tempKeys = object.keys;
    this.changeDetector.detectChanges();
  }

  public back(): void {
    this.tempKeys = this.user.config.keys;
    this.changeDetector.detectChanges();
    this.router.navigate([{ outlets: { menu: 'options' } }]);
  }

  public apply(): void {
    this.user.config.keys = this.cloneKeys(this.tempKeys);
    this.user.updateKeys();
    this.router.navigate([{ outlets: { menu: 'options' } }]);
  }



  



}
