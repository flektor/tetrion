import { NgModule, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { LoginPage } from './login.page';

const routes: Routes = [
  {
    path: '',
    component: LoginPage
  }
];

@NgModule({

  declarations: [LoginPage],
  imports: [
    CommonModule,
    // ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  exports: [LoginPage],
  entryComponents: [LoginPage],
})
export class LoginPageModule {

  customElementComponent: Type<any> = LoginPage;

  constructor() { }

  ngDoBootstrap() { }
}
