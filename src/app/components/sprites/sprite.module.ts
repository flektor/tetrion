import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageSpriteComponent } from './sprite.component';

@NgModule({
    declarations: [MessageSpriteComponent],
    imports: [
        CommonModule
    ],
    exports: [MessageSpriteComponent]
})
export class MessageSpriteModule { }
