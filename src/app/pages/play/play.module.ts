import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayComponent } from './play.component';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { GameRulesEditorModule } from 'src/app/components/game-rules-editor/game-rules-editor.module'; 


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
    GameRulesEditorModule,
    RouterModule.forChild(routes)
  ],
  exports: [PlayComponent]
})
export class PlayModule { }

