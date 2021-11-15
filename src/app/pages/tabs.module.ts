import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TabsPage } from './tabs.page';
import { AuthService } from '../services/auth/auth.service';
import { SceneModule } from '../scene/scene.module';
import { BlankPage } from './blank';


const _children = [
  {
    path: '',
    component: BlankPage
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'replays',
    loadChildren: () => import('./replays/replays.module').then(m => m.ReplaysModule),
  },
  {
    path: 'play',
    loadChildren: () => import('./play/play.module').then(m => m.PlayModule),
  },
  {
    path: 'skins',
    loadChildren: () => import('./skins/skins.module').then(m => m.SkinsModule),
  }, {
    path: 'profile',
    canActivate: [AuthService],
    loadChildren: () => import('./profile/profile.module').then(m => m.ProfilePageModule),
  },

]

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: _children,
  }
];



@NgModule({
  declarations: [
    TabsPage
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SceneModule,
    RouterModule.forChild(routes),
  ],

})
export class TabsPageModule { }

