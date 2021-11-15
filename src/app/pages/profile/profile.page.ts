import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { ActivatedRoute, Router } from '@angular/router';
import { LevelsAchievmentComponent } from 'src/app/achievements/levels.component';
import { GameService } from 'src/app/services/game/game.service';
import { UserCareerStats } from 'src/app/services/user/user.interface';
import { UserService } from 'src/app/services/user/user.service';

@Component({
  selector: 'profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements AfterViewInit {


  @ViewChild("level") levelComponent: LevelsAchievmentComponent;
  gameMode: 'all' | 'solo' | '1v1';
  username: string;
  career: UserCareerStats;
  highScore: number;
  maxLevel: number;
  totalGames: number;
  total1v1Wins: number;
  total1v1Losses: number;

  constructor(
    public user: UserService,
    private aff: AngularFireFunctions,
    private game: GameService,
    private router: Router,
    private route: ActivatedRoute
  ) { }



  async ngAfterViewInit(): Promise<void> {



    this.route.queryParams.subscribe(async (object: any) => {

      if (!object.username) {

        if (!this.user.career) {
          this.username = this.user.username;
          this.career = await this.fetchPlayerCareerData(this.user.username);
          this.user.updateCareer();
        }

        this.calculateStats('all');
        return;
      }
      this.username = object.username;
      this.career = await this.fetchPlayerCareerData(object.username);
      this.calculateStats('all');

    });

  }

  loadingTheme: boolean = false;

  async copyTheme(username: string) {
    if (this.loadingTheme) return;

    this.loadingTheme = true;

    try {

      const theme = await this.aff.httpsCallable('getPlayerTheme')(username).toPromise();

      console.log(theme)
      this.game.goToSkinsView();

      this.router.navigate(['/skins'], { queryParams: { theme: JSON.stringify(theme) } });
      this.loadingTheme = false;
    } catch (error) {
      console.log(error)
    }

  }

  private async fetchPlayerCareerData(username: string): Promise<UserCareerStats> {
    return await this.aff.httpsCallable('getPlayerCareer')(username).toPromise();
  }


  public calculateStats(gameMode: 'all' | 'solo' | '1v1'): void {

    this.gameMode = gameMode;
    const stats = this.career;
    switch (this.gameMode) {
      case 'all':
        this.highScore = Math.max(stats.solo.highScore, stats.oneVsOne.highScore);
        this.maxLevel = Math.max(stats.solo.maxLevel, stats.oneVsOne.maxLevel);
        this.totalGames = stats.solo.games + stats.oneVsOne.games;
        this.total1v1Wins = stats.oneVsOne.wins;
        this.total1v1Losses = stats.oneVsOne.losses;
        break;
      case 'solo':
        this.highScore = stats.solo.highScore;
        this.maxLevel = stats.solo.maxLevel;
        this.totalGames = stats.solo.games;
        break;
      case '1v1':
        this.highScore = stats.oneVsOne.highScore;
        this.maxLevel = stats.oneVsOne.maxLevel;
        this.totalGames = stats.oneVsOne.games;
        this.total1v1Wins = stats.oneVsOne.wins;
        this.total1v1Losses = stats.oneVsOne.losses;
        break;
    }

    this.levelComponent.enableShowSpinner(false);
    this.levelComponent.reset();
    this.levelComponent.animate();
  }
}