
import { GameConfig, GameStatus, IGameData, IGameReplayData } from 'src/app/engine/game.interface'; import { MeshPhongMaterialParameters } from 'three';
import { GameCommand, GamePoints } from 'src/app/logger/commands';
import { ThemeConfig } from 'src/app/services/theme/theme.interface';
import { VideoConfig } from 'src/app/services/user/user.interface';
import { EventProps } from 'src/app/offscreen-orbit-controls/offscreen-orbit-controls';

export interface SkinEditable {

    getSkin(index: number, size: number, materialParams: MeshPhongMaterialParameters[]): Promise<Blob>;

    getSkinsNumber(): number | Promise<number>;

    setThemePrimaryColor(color: string | number): void;

    setThemeSecondaryColor(color: string | number): void;

    setThemeBrickGeometry(index: number): void;

    overrideThemeBlock(index: number): void;

    setTheme(config: ThemeConfig): void;

    nextΤhemeBlock(): Promise<boolean>;

    prevΤhemeBlock(): Promise<boolean>;


}

export interface Pushable {

    pushCommand(username: string, command: GameCommand, peerSend?: boolean): void;

    pushPoints(username: string, points: GamePoints): void;


}


export interface IScenario extends SkinEditable {

    // init(data?: IScenarioData): Promise<void>;


    pushIndices(indices: number[]): void;

    followCommand(username: string, command: GameCommand): void;

    dispatchControlsParentEvent(event: EventProps): void;

    dispatchControlsEvent(event: EventProps): void;

    initOrbitControls(): void;

    onExitGame(): Promise<void>;

    onGameOver(): Promise<void>;

    onReady(): Promise<void>

    play(): void;

    pause(): void;

    restart(gameData: IGameData): void;

    changePlayerTheme(username: string, theme: ThemeConfig): void;

    setGameConfig(config: GameConfig): void;

    getGameConfig(): Promise<GameConfig>;

    replay(data: IGameReplayData, delay: number): Promise<void>;

    turn(direction: number): any | Promise<any>;

    move(direction: number): any | Promise<any>;

    fall(time: number): any | Promise<any>;

    getStatus(): GameStatus | Promise<GameStatus>;

    setSize(width: number, height: number): void;

    setStatsVisible(isTrue: boolean): void;

    setFog(isTrue: boolean): void;

    setCastShadows(isTrue: boolean): void;

    setReceiveShadows(isTrue: boolean): void;

    setAntialias(isTrue: boolean): void;

    exitGame(): void;

    goToIntroView(): Promise<void>;

    goToProfileView(): Promise<void>;

    goToSkinsView(): Promise<void>;

    goToReplaysView(): Promise<void>;

    getSkinArrowsPosition(index:number): Promise<ScreenPosition>;

}

export interface ScreenPosition {
    x: number;
    y: number;
}


export interface IScenarioData {

    debugRenderer?: boolean;

    useGameWorker?: boolean;

    useCannonWorker?: boolean;

    useTweenWorker?: boolean;

    gameData: IGameData;

    videoConfig: VideoConfig;

    stageCanvas: HTMLCanvasElement;

    nextBlockStageCanvas: HTMLCanvasElement;

}
