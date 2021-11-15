import { NgModule } from '@angular/core';
import { ColorPickerComponent } from './color-picker.component';
import { CommonModule } from '@angular/common';  
import { ColorSketchModule } from 'ngx-color/sketch';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [ColorPickerComponent],
  imports: [
    CommonModule,  
    IonicModule,
    ColorSketchModule,
  ],
  exports: [ColorPickerComponent]
})
export class ColorPickerModule { }
