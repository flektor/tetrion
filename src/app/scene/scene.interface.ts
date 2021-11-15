import { UIConfigurator } from './scene.page'; 
import { GameStatus, IGameData } from '../engine/game.interface';
// import { Observable } from 'rxjs';

export interface IScene extends UIConfigurator {
    
  // getSkinsContainer(): Group;
  // onExitGame(): Observable<void> ;

  goToIntroView(): void;

  goToProfileView(): void;

  goToSkinsView(): void;

  goToReplaysView(): void;

  pause(): void;

  play(): void;

  restart(): void;

  getStatus(): GameStatus;

  replay(data: IGameData): Promise<void>;

  setFog(isTrue: boolean): void;

  setAntialias(isTrue: boolean): void;

  setStatsVisible(isTrue: boolean): void;

  exitGame(): void;
    
  keydown(key: string): void;
  
  getStatus(): GameStatus;

  goToIntroView(): void;

  goToProfileView(): void;

  goToSkinsView(): void;

  goToReplaysView(): void;

  setAntialias(isTrue: boolean): void;

  setShadows(isTrue: boolean): void;

  hasAntialias(): boolean;

  hasFog(): boolean;

  setFog(isTrue: boolean): void;
}




