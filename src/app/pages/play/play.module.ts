import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayComponent } from './play.component';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BoardEditorModule } from 'src/app/components/board-editor/board-editor.module'; 


const routes: Routes = [
  {
    path: '',
    component: PlayComponent
  }
];

@NgModule({

  declarations: [
    PlayComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    BoardEditorModule,
    RouterModule.forChild(routes)
  ],
  exports: [PlayComponent]
})
export class PlayModule { }

