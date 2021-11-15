import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkinsTableComponent } from './skins-table.component';

@NgModule({
  declarations: [SkinsTableComponent],
  imports: [
    CommonModule,
  ],
  exports: [SkinsTableComponent]
})
export class SkinsTableModule { }
