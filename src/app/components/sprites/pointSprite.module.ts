import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PointSpriteComponent } from './pointSprite.component';

@NgModule({
    declarations: [PointSpriteComponent],
    imports: [
        CommonModule
    ],
    exports: [PointSpriteComponent]
})
export class PointSpriteModule { }
