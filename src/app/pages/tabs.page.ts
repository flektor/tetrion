import { Component, OnInit, ViewChild } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { IonTabs } from '@ionic/angular';;
import { trigger, state, style, transition, animate } from '@angular/animations';
import { UserService } from '../services/user/user.service';
import { FcmService } from '../services/fcm/fcm.service';
import { GameMode, GameStatus } from '../engine/game.interface';
// import { OnlineStatus } from '../services/user/user.interface';
import { GameService } from '../services/game/game.service';
import { filter, skip } from 'rxjs/operators';


export type TabsPageStatus = 'WAITING' | 'PLAYING_GAME' | 'EXITING_GAME';


@Component({

  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  animations: [
    trigger('hide', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible => hidden', [animate('0s .5s ease-out')]),
      transition('hidden => visible', [animate('0s 1s ease-in')])
    ]),

  ],
})

export class TabsPage implements OnInit {

  users;
  areTabsActive = true;

  pageTransitionRunning: boolean = false;


  @ViewChild(IonTabs) tabs: IonTabs;

  constructor(
    public user: UserService,
    private router: Router,
    public fcm: FcmService,
    private game: GameService,
  ) {

  }

  async logout() {
    await this.user.logout();
    await this.goToView('/login'); 
  }

  animationDone() {

    if (this.hideTabsCounter < 2) {
      return;
    }

    if (this.status === 'EXITING_GAME') {
      this.areTabsActive = true;
      this.status = 'WAITING';
      return;
    }

    this.areTabsActive = false;

  }


  hideTabs(): 'visible' | 'hidden' {

    if (!this.ready) {
      return 'visible';
    }

    if (this.hideTabsCounter < 2) {
      this.hideTabsCounter++;
      return 'visible';
    }

    if (this.game.getStatus() === GameStatus.Game) {
      return 'hidden';
    }

    return 'visible';

  }


  ngAfterInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe((event: NavigationStart) => this.goToView(event.url));

  }

  async ngOnInit() {

    this.router.navigate([{ outlets: { menu: null } }]);

    await this.game.onReady();

    this.ready = true;


    if (['/play', '/replays', ''].includes(this.router.url)) {
      this.game.goToIntroView();
    } else if (['/profile', '/login'].includes(this.router.url)) {
      this.game.goToProfileView();
    } else {
      this.goToView(this.router.url);
    }

    this.game.onEnterGame().pipe(skip(1)).subscribe(() => {

      this.status = 'PLAYING_GAME';

      this.game.onExitGame().then(() => {

        this.hideTabsCounter = 0;
        this.status = 'EXITING_GAME';
        this.areTabsActive = true;

        // if (this.game.getMode() === GameMode.OneVsOne) {
        //   this.user.updateOnlineStatus(OnlineStatus.Lobby);
        // } else {
        //   this.user.updateOnlineStatus(OnlineStatus.None);
        // }

      });

    });

  }

  hasTheSameView(urls: string[], url: string) {
    return urls.includes(url) && urls.includes(this.router.url);
  }

  private goToView(tab: string) {

    if (this.hasTheSameView(['/profile', '/login', '/register'], tab)) {
      return this.router.navigateByUrl(tab);
    }

    if (this.hasTheSameView(['/play', '/replays'], tab)) {
      return this.router.navigateByUrl(tab);
    }

    let promise: Promise<any>;
    switch (tab) {
      case '/skins':
        promise = new Promise(async resolve => {
          this.game.goToSkinsView().then(() => {
            this.game.getSkinArrowsPosition(3).then(positions => {
              resolve({
                arrowsPosition: JSON.stringify(positions)
              });
            })
          })
        });

        break;
      case '/profile':
      case '/login':
      case '/register':
        promise = this.game.goToProfileView();
        break;
      case '/replays':
        promise = this.game.goToReplaysView();
        break;
      default:
        promise = this.game.goToIntroView();
        tab = '/play';
    }


    this.router.navigateByUrl('/');

    promise.then((queryParams) => {
      this.status = 'WAITING';
      this.router.navigateByUrl(tab);
      this.router.navigate([tab], { queryParams });
    })
  }

  async setTab(tab: string, event?: MouseEvent) {

    if (event) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }

    if (tab === this.router.url) return;

    this.goToView(tab);

  }


  private ready: boolean = false;
  private hideTabsCounter: number = 0;


  private status: TabsPageStatus;

  // private updateUsers() {

  //   if (localStorage.getItem('players')) {
  //     this.users = of(JSON.parse(localStorage.getItem('players')));
  //     console.log('Players restored from local storage.');
  //     return;
  //   }

  //   this.users = this.aff.httpsCallable('getUsers')({})
  //   this.users.subscribe((data => {
  //     let index = 0;
  //     for (let user of data) {
  //       if (user.username === this.user.username) {
  //         data.splice(index, 1);
  //       }
  //       index++;
  //     }
  //     localStorage.setItem('players', JSON.stringify(data));
  //     console.log('Players stored locally.');
  //   }));
  // }

}
