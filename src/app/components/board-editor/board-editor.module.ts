import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { IonicModule } from '@ionic/angular';
import { BoardEditorComponent } from './board-editor.component';

@NgModule({
  declarations: [BoardEditorComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [BoardEditorComponent]
})
export class BoardEditorModule { }
