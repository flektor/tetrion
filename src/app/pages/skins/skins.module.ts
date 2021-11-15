import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkinsComponent } from './skins.component';
import { RouterModule } from '@angular/router';
import { GeometryPickerModule } from 'src/app/components/geometry-picker/geometry-picker.module';
import { IonicModule } from '@ionic/angular';
import { ThemeSaverPopoverModule } from 'src/app/components/theme-saver-popover/theme-saver-popover.module';


const routes = [
  {
    path: '',
    component: SkinsComponent
  }
];

@NgModule({
  declarations: [SkinsComponent],
  imports: [
    CommonModule,
    IonicModule,
    GeometryPickerModule,
    ThemeSaverPopoverModule, 
    RouterModule.forChild(routes)
  ],
  exports: [SkinsComponent]
})
export class SkinsModule { }
