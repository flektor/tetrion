import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme/theme.service';

@Component({
  selector: 'app-theme-saver-popover',
  templateUrl: './theme-saver-popover.component.html',
  styleUrls: ['./theme-saver-popover.component.scss'],
})
export class ThemeSaverPopoverComponent {

  hasValidTitle = false;
  doesTitleExist = false;
  name = '';


  errorMessage: string = '';

  constructor(public theme: ThemeService, private popCtrl: PopoverController) { }

  apply() {
    this.popCtrl.dismiss({ save: true, name: this.name });
  }

  back() {
    this.popCtrl.dismiss({ save: false });
  }

  rename(name: string | number): void {
    this.name = name + '';
    if (this.name.trim() === '') {
      this.hasValidTitle = false;
      this.errorMessage = 'Title can not be empty!'
      return;
    }

    if (this.theme.doesThemeExist(this.name)) {
      this.doesTitleExist = true;
      this.errorMessage = 'Title is already exists! Do you want to override this theme?'
      return;
    }
    this.errorMessage = '';
    this.doesTitleExist = false;
    this.hasValidTitle = true;
  }


}


export interface ThemeSaverProps {
  save: boolean;
  name?: string;
}