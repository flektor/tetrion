import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router'; 


const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('src/app/pages/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'options',
    outlet: 'menu',
    loadChildren: () => import('src/app/menu/options/options.module').then(m => m.OptionsModule)
  },
  {
    path: 'audio',
    outlet: 'menu',
    loadChildren: () => import('src/app/menu/audio/audio.module').then(m => m.AudioModule)
  },
  {
    path: 'video',
    outlet: 'menu',
    loadChildren: () => import('src/app/menu/video/video.module').then(m => m.VideoModule)
  },
  {
    path: 'controls',
    outlet: 'menu',
    loadChildren: () => import('src/app/menu/controls/controls.module').then(m => m.ControlsModule)
  },
  {
    path: 'restart',
    outlet: 'menu',
    loadChildren: () => import('src/app/menu/restart/restart.module').then(m => m.RestartModule)
  },
  {
    path: 'exit',
    outlet: 'menu',
    loadChildren: () => import('src/app/menu/exit/exit.module').then(m => m.ExitModule)
  },

  {
    path: '',
    redirectTo: '/play',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '',
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes,
      // { preloadingStrategy: PreloadAllModules }
    )
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
