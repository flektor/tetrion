import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireFunctionsModule, REGION } from '@angular/fire/functions';
import { AngularFireMessagingModule } from '@angular/fire/messaging';
import { ServiceWorkerModule } from '@angular/service-worker';

import { FCM } from '@ionic-native/fcm/ngx';
import { AudioService } from './services/audio/audio.service';
import { AuthService } from './services/auth/auth.service';
import { FcmService } from './services/fcm/fcm.service';
import { GameService } from './services/game/game.service';
import { PeerService } from './services/peer/peer.service';
import { ThemeService } from './services/theme/theme.service';
import { UserService } from './services/user/user.service';
import firebaseConfig from './firebase';
import { customAnimation } from './pages/tab-animations';


@NgModule({
  declarations: [AppComponent],

  imports: [
    BrowserModule,
    IonicModule.forRoot({
      navAnimation: customAnimation
    }),
    AppRoutingModule,

    BrowserAnimationsModule,
    HttpClientModule,

    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireFunctionsModule,
    AngularFireMessagingModule,
    //  AngularFireDatabaseModule,


    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),

  ],
  providers: [
    StatusBar,
    SplashScreen,
    // NativeAudio, 
    UserService,
    AuthService,
    AudioService,
    ThemeService,
    GameService,
    FCM,
    FcmService,
    PeerService,


    // { provide: FirestoreSettingsToken, useValue: {} },
    // { provide: FunctionsRegionToken, useValue: 'europe-west1' },
    // { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }



    { provide: REGION, useValue: 'europe-west1' },
    // { provide: ORIGIN, useValue: ['localhost', 8080] },

    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
