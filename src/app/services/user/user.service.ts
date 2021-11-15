import { Injectable } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import { first } from 'rxjs/operators';
import { AngularFirestore } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { LoaderService } from '../../loader/loader.service';
import { UserConfig, UserCareerStats, OnlineStatus } from './user.interface';
import { AngularFireFunctions } from "@angular/fire/functions";
import { guestConfig } from "./guest-config";
import { ThrowStmt } from "@angular/compiler";


@Injectable()
export class UserService {

  public username: string = '';
  public uid: string = '';
  public config: UserConfig;
  private isReady = new Event('isReady');
  private isSycned: boolean = false;

  // private isOffline: boolean = false;

  public career: UserCareerStats;

  constructor(
    private afAuth: AngularFireAuth,
    private afstore: AngularFirestore,
    private aff: AngularFireFunctions,
    private loader: LoaderService,
    private router: Router
  ) {
    this.init();
  }

  public async onSync(): Promise<boolean> {
    if (this.isSycned === undefined) {
      return new Promise(resolve => {
        document.addEventListener('isReady', () => resolve(this.isSycned), false);
      })
    }
    return this.isSycned;

  }


  private async init(): Promise<void> {
    this.username = "Guest";
    // this.config = guestConfig();
    // this.storeConfig();

    if ([
      '/login',
      '/register',
      '/play'
    ].includes(this.router.url)) {
      return;
    }
    await this.sync()

  }


  async isAuthenticated(): Promise<boolean> {

    // TODO Cedentials
    if (this.uid && this.username) return true;

    this.username = localStorage.getItem('username');
    this.uid = localStorage.getItem('uid');
    if (this.uid && this.username) return true;

    const user = await this.afAuth.authState.pipe(first()).toPromise();
    if (user) {
      localStorage.setItem('username', user.email.split('@')[0]);
      localStorage.setItem('uid', user.uid);
      return true;
    }
    this.logout();
    return false;
  }


  // continueAsGuest() {
  //   this.isOffline = true;
  // }

  public async register(username: string, password: string): Promise<string> {
    try {
      const res = await this.afAuth.createUserWithEmailAndPassword(username + "@tetrion.com", password);
      if (!res.user) return JSON.stringify(res);

      this.afstore.doc(`users/${res.user.uid}`).set({ username: username });
      localStorage.setItem('username', res.user.email.split('@')[0]);
      localStorage.setItem('uid', res.user.uid);

      await this.sync();

      this.router.navigateByUrl('/profile');
      return "logged in!";

    } catch (err) {
      console.dir(err);
      return err.message
    }
  }


  public async login(username: string, password: string): Promise<Object> {
    try {
      // TODO TOFIX remove @tetrion.com
      const res = await this.afAuth.signInWithEmailAndPassword(username + '@tetrion.com', password);
      if (res.user) {

        this.username = res.user.email.split('@')[0];
        this.uid = res.user.uid;

        localStorage.setItem('username', this.username);
        localStorage.setItem('uid', this.uid);

        await this.sync();
        this.router.navigateByUrl('/profile');

        return res;
      }
    } catch (error) { return error }
  }


  public async logout(): Promise<void> {

    if (this.config && this.config.isSubbedInLobby) {
      this.aff.httpsCallable('unsubscribeFromLobby')({
        token: this.config.fcm.token
      });
    }


    await this.afAuth.signOut();

    localStorage.clear();
    this.username = '';
    this.uid = '';

    this.config = guestConfig();
  }

  private async sync(): Promise<boolean> {
    // if (!await this.isAuthenticated()) {
    //   console.error('User not authenticated.');
    //   this.logout();
    //   this.isSycned = false;
    //   document.dispatchEvent(this.isReady);
    //   return false;
    // }

    console.log("Sycn user configurations data.")

    // try to retrieve data from local storage
    if (JSON.parse(localStorage.getItem('synced'))) {
      console.log('Loading locally stored user config..');
      this.username = localStorage.getItem('username');
      this.uid = localStorage.getItem('uid');
      this.config = JSON.parse(localStorage.getItem('config'));

      if (this.uid) {
        this.config.isGuest = false;
      }
      document.dispatchEvent(this.isReady);
      return true;
    }

    console.log('Loading default user config..');
    this.config = guestConfig();
    // this.config = await this.loader.loadJson("assets/default-user-config.json");

    await this.getServerData();

    this.config.isSubbedInLobby = false;

    this.storeConfig();
    localStorage.setItem('synced', 'true');
    this.isSycned = true;

    if (this.uid) {
      this.config.isGuest = false;
    }
    document.dispatchEvent(this.isReady);
    return true;
  }

  private async getServerData(): Promise<void> {

    if (this.config.isGuest) {
      return;
    }

    console.log('Loading user config from server..');
    const userData = await this.afstore.doc(`users/${this.uid}`)
      .valueChanges().pipe(first()).toPromise() as UserConfig;

    const keys = ['game', 'video', 'audio', 'keys', 'peer', 'fcm', 'theme'];

    for (let confKey of keys) {
      if (userData[confKey]) {
        for (let attrKey of Object.keys(userData[confKey])) {
          this.config[confKey][attrKey] = userData[confKey][attrKey];
        }
      }
    }

  }


  private storeConfig() {
    console.log(`The user config stored locally`)
    localStorage.setItem('config', JSON.stringify(this.config));
  }


  updateToken() {

    if (this.config.isGuest) {
      return;
    }

    console.log(`User token: ${this.config.fcm.token}..`);
    this.afstore.collection('users').doc(this.uid).update({ fcm: this.config.fcm });
    this.storeConfig();
  }

  updateSignal() {

    if (this.config.isGuest) {
      return;
    }

    console.log(`Updating peer signal to ${this.config.peer.signal}..`);
    this.afstore.collection('users').doc(this.uid).update({ peer: this.config.peer });
    this.storeConfig();
  }

  updateFcmPermissions() {
    if (this.config.isGuest) {
      return;
    }

    console.log(`Updating fcm permissions to ${this.config.fcm.hasPermissions}`);
    this.afstore.collection('users').doc(this.uid).update({ 'fcm.hasPermissions': this.config.fcm.hasPermissions });

    this.storeConfig();
  }

  async updateAudio() {

    this.storeConfig();

    if (this.config.isGuest) {
      return;
    }
    console.log('Updating audio config..');
    this.afstore.collection('users').doc(this.uid).update({ audio: this.config.audio });
  }

  async updateTheme() {

    this.storeConfig();

    if (this.config.isGuest) {
      return;
    }

    console.log('Updating theme config..');
    this.afstore.collection('users').doc(this.uid).update({ theme: this.config.theme });

  }

  async updateVideo() {

    this.storeConfig();

    if (this.config.isGuest) {
      return;
    }

    console.log('Updating video config..');
    this.afstore.collection('users').doc(this.uid).update({ video: this.config.video });

  }

  updateCareer() {

    if (!this.config.isGuest && this.career) {
      this.storeConfig();
    }
  }

  updateMode(): any {
    this.storeConfig();

    if (this.config.isGuest) {
      return;
    }

    console.log(`Updating game mode to ${this.config.game.mode}`);
    this.afstore.collection('users').doc(this.uid).update({ 'game.mode': this.config.game.mode });

  }


  async updateOnlineStatus(status:
    OnlineStatus.InGame |
    OnlineStatus.Signaling |
    OnlineStatus.Lobby |
    OnlineStatus.None |
    OnlineStatus.QuickGame,
    gameId?: string): Promise<void> {


    if (this.config.isGuest) {
      return;
    }
    console.log(`Updating online status mode to ${status}`);

    this.config.onlineStatus = status;

    switch (status) {
      case OnlineStatus.None:
        return await this.afstore.collection('lobby').doc(this.uid).delete();


      case OnlineStatus.Signaling:
        return await this.afstore.collection('lobby').doc(this.uid).update({ status: status, gameId: gameId });

      case OnlineStatus.Lobby:
        return await this.afstore.collection('lobby').doc(this.uid).set({
          status: status,
          username: this.username,
          token: this.config.fcm.token,
          signal: this.config.peer.signal
        }, { merge: true });
      default:
        return await this.afstore.collection('lobby').doc(this.uid).update({ status: status });
    }

  }

  async updateGame() {

    this.storeConfig();

    if (this.config.isGuest) {
      return;
    }

    console.log('Updating game config..');
    this.afstore.collection('users').doc(this.uid).update({ game: this.config.game });

  }

  async updateConfig() {

    this.storeConfig();

    if (this.config.isGuest) {
      return;
    }

    console.log('Updating user config..');
    this.afstore.doc(`users/${this.uid}`).set(this.config);

  }

  async updateKeys() {

    this.storeConfig();

    if (this.config.isGuest) {
      return;
    }

    console.log('Updating keys config..');
    this.afstore.collection('users').doc(this.uid).update({ keys: this.config.keys });

  }


}

