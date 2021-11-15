import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoComponent } from './video.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { GeometryPickerModule } from 'src/app/components/geometry-picker/geometry-picker.module';

const routes = [
  {
    path: '',
    component: VideoComponent
  }
];

@NgModule({
  declarations: [VideoComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GeometryPickerModule,
    RouterModule.forChild(routes)
  ],
  exports:[VideoComponent]
})
export class VideoModule { }
