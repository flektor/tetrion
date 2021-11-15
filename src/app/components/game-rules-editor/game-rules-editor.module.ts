import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { IonicModule } from '@ionic/angular';
import { GameRulesEditorComponent } from './game-rules-editor.component';

@NgModule({
  declarations: [GameRulesEditorComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [GameRulesEditorComponent]
})
export class GameRulesEditorModule { }
