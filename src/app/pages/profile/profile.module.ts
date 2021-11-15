import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ProfilePage } from './profile.page'; 
import { LevelsAchievmentComponent } from 'src/app/achievements/levels.component';
// import { ColorsAchievmentComponent } from 'src/app/achievements/colors.component';
// import { OnfireAchievmentComponent } from 'src/app/achievements/onfire.component';
// import { RankAchievmentComponent } from 'src/app/achievements/rank.component';
// import { SmashAchievmentComponent } from 'src/app/achievements/smash.component';
// import { TetrionAchievmentComponent } from 'src/app/achievements/tetrion.component';

const routes: Routes = [
  {
    path: '',
    component: ProfilePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule, 
    RouterModule.forChild(routes)
  ],
  declarations: [
    ProfilePage,
    LevelsAchievmentComponent,
    // OnfireAchievmentComponent,
    // TetrionAchievmentComponent,
    // SmashAchievmentComponent,
    // ColorsAchievmentComponent,
    // RankAchievmentComponent
  ],
  exports:[ProfilePage]
})
export class ProfilePageModule { }
