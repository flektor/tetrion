import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';  
import { ThemeSaverPopoverComponent } from './theme-saver-popover.component';

@NgModule({
  
  declarations: [ThemeSaverPopoverComponent],

  imports: [
    CommonModule,
    FormsModule,
    IonicModule,  
  ],

  exports: [ThemeSaverPopoverComponent]
})

export class ThemeSaverPopoverModule { }
