import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestartComponent } from './restart.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

const routes = [
  {
    path: '',
    component: RestartComponent
  }
];

@NgModule({
  declarations: [RestartComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  exports:[RestartComponent]
})
export class RestartModule { }
