import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { IonicModule } from '@ionic/angular';
import { ScenePage } from './scene.page';
import { MessageSpriteModule } from '../components/sprites/sprite.module';
import { PointSpriteModule } from '../components/sprites/pointSprite.module';
import { MenuModule } from '../menu/menu.module'; 

@NgModule({ 
  declarations: [
    ScenePage
  ],
  imports: [
    IonicModule,
    CommonModule,
    MenuModule, 
    MessageSpriteModule,
    PointSpriteModule, 
  ],
  exports: [ScenePage]
})
export class SceneModule { }
