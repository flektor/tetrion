import { Injectable } from "@angular/core";
import { AngularFireMessaging } from "@angular/fire/messaging";
import { AngularFireFunctions } from "@angular/fire/functions";
import { tap } from "rxjs/operators";

import { FCM } from '@ionic-native/fcm/ngx';
import { Platform } from '@ionic/angular';
import { UserService } from "../user/user.service";

@Injectable({
  providedIn: 'root'
})
export class FcmService {


  private topics: Array<string>;

  constructor(
    private user: UserService,
    private platform: Platform,
    private fcm: FCM,
    private afMessaging: AngularFireMessaging,
    private aff: AngularFireFunctions,

  ) {
 
    console.log(this.user.config)
    this.topics = new Array();
    this.user.config.fcm.hasPermissions = false;
    this.user.updateFcmPermissions();
  }


  private hasPermissions: boolean = false;


  async requestPermission(): Promise<void> {
    /*
    if (this.platform.is('cordova')) {

      this.fcm.getToken().then(token => {
        this.user.updateToken(token);
      });

      let obs = this.fcm.onTokenRefresh();
      obs.subscribe(token => {
        this.user.updateToken(token);
      });
      return obs.toPromise();
    }
    */

    if (!this.hasPermissions) {
      await this.afMessaging.requestPermission.toPromise();
      this.hasPermissions = true;
    }

    this.user.config.fcm.token = await this.afMessaging.getToken.toPromise();
    this.user.config.fcm.hasPermissions = true;
    this.user.updateToken();

    this.afMessaging.tokenChanges.toPromise().then(token => {
      this.user.config.fcm.token = token;
      this.user.updateToken();
    });
  }


  async deleteToken() {
    for (let topic of this.topics) {
      this.unsubscribeFromTopic(topic);
    }
    const token = this.user.config.fcm.token = undefined;
    await this.afMessaging.deleteToken(token).toPromise();
    this.hasPermissions = false;
  }


  // private onMessage(callback: any): void {
  //   this.afMessaging.onMessage(payload => callback(payload.data));
  // }


  async subscribeTo(topic: string) {
    // if it is already subscribed return
    if (this.topics.indexOf(topic) >= 0) {
      return;
    }

    // if (this.platform.is('cordova')) {
    //   console.log('cordova?')
    //   this.fcm.subscribeToTopic(topic).then(() => {
    //     //  this.makeToast(`subscribed to ${topic}`);
    //     console.log(`subscribed to ${topic}`)
    //     this.topics.push(topic);
    //   });

    // } else {

    this.aff.httpsCallable('subscribeToLobby')({ token: this.user.config.fcm.token }).toPromise().then(() => {
      console.log(`subscribed to lobby`);
      this.topics.push(topic);
    })
    /*
    // .pipe(tap(_ => {
    //   console.log(`Subscribed to ${topic}`)
    //   // this.makeToast(`subscribed to ${topic}`)
    // }))
    // .subscribe(message => console.log(message));
    // this.showMessages();
    // }
        */
  }

  private unsubscribeFromTopic(topic: string) {
    const index = this.topics.indexOf(topic)
    if (index < 0) {
      return;
    }

    // if (this.platform.is('cordova')) {
    //   this.fcm.unsubscribeFromTopic(topic).then(() => {
    //     // this.makeToast(`unsubscribed from ${topic}`);
    //     this.topics.splice(index, 1);
    //   });

    // } else {
    this.aff
      .httpsCallable('unsubscribeFromTopic')({ topic, token: this.user.config.fcm.token })
      .pipe(tap(_ => {
    //    //  this.makeToast(`unsubscribed from ${topic}`)
        this.topics.splice(index, 1);
      }))
      .subscribe();
    // }
  }

}