import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { GeometryPickerComponent } from './geometry-picker.component';
import { ColorPickerModule } from '../color-picker/color-picker.module';
import { SkinsTableModule } from './skins-table/skins-table.module';

@NgModule({
  
  declarations: [GeometryPickerComponent],

  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SkinsTableModule,
    ColorPickerModule,
  ],

  exports: [GeometryPickerComponent]
})

export class GeometryPickerModule { }
