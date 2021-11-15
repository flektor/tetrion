import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReplaysComponent } from './replays.component';
import { RouterModule } from '@angular/router';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { IonicModule } from '@ionic/angular';
import { LineChartModule } from '@swimlane/ngx-charts';

const routes = [
  {
    path: '',
    component: ReplaysComponent
  }
];

@NgModule({
  declarations: [ReplaysComponent],
  imports: [
    CommonModule,
    IonicModule,
    NgxDatatableModule,
    LineChartModule,
    RouterModule.forChild(routes)
  ],
  exports: [ReplaysComponent]
})

export class ReplaysModule { }
