import { expose } from 'comlink';
import { MeshPhongMaterialParameters } from 'three';
import { GameConfig, GameStatus, IGameData, IGameReplayData } from 'src/app/engine/game.interface';
import { Scenario } from 'src/app/engine/scenario';
import { IScenarioData, IScenario, Pushable, ScreenPosition } from 'src/app/engine/scenario.interface';
import { GameCommand, GamePoints } from 'src/app/logger/commands';
import { EventProps } from 'src/app/offscreen-orbit-controls/offscreen-orbit-controls';
import { ThemeConfig } from 'src/app/services/theme/theme.interface';


export class Game implements IScenario, Pushable {

    async getSkinArrowsPosition(index: number): Promise<ScreenPosition> {
        return this.scenario.getSkinArrowsPosition(index);
    }


    changePlayerTheme(username: string, theme: ThemeConfig): void {
        this.scenario.changePlayerTheme(username, theme);
    }


    dispatchControlsParentEvent(event: EventProps): void {
        this.scenario.dispatchControlsParentEvent(event);
    }


    dispatchControlsEvent(event: EventProps): void {
        this.scenario.dispatchControlsEvent(event);
    }


    initOrbitControls(): void {
        this.scenario.initOrbitControls();
    }


    followCommand(username: string, command: GameCommand): void {
        this.scenario.followCommand(username, command)
    }


    pushIndices(indices: number[]) {
        (self as any).postMessage({
            operation: 'indices',
            indices: indices
        });
    }


    pushCommand(username: string, command: GameCommand, peerSend?: boolean) {
        (self as any).postMessage({
            operation: 'command',
            username: username,
            command: JSON.stringify(command)
        });
    }


    pushPoints(username: string, points: GamePoints) {
        (self as any).postMessage({
            operation: 'points',
            username: username,
            points: JSON.stringify(points)
        });
    }


    setGameConfig(config: GameConfig) {
        this.scenario.setGameConfig(config);
    }

    async getGameConfig(): Promise<GameConfig> {
        return this.scenario.getGameConfig();
    }

    getSkinsNumber(): number | Promise<number> {
        return this.scenario.getSkinsNumber();
    }


    getSkin(index: number, size: number, materialParams: MeshPhongMaterialParameters[]): Promise<Blob> {
        return this.scenario.getSkin(index, size, materialParams);
    }


    setThemePrimaryColor(color: string | number): void {
        this.scenario.setThemePrimaryColor(color);
    }


    setThemeSecondaryColor(color: string | number): void {
        this.scenario.setThemeSecondaryColor(color);
    }


    setTheme(config: ThemeConfig): void {
        this.scenario.setTheme(config);
    }


    setThemeBrickGeometry(index: number): void {
        this.scenario.setThemeBrickGeometry(index);
    }


    overrideThemeBlock(index: number): void {
        this.scenario.overrideThemeBlock(index);
    }


    nextΤhemeBlock(): Promise<boolean> {
        return this.scenario.nextΤhemeBlock();
    }


    prevΤhemeBlock(): Promise<boolean> {
        return this.scenario.prevΤhemeBlock();
    }


    onExitGame(): Promise<void> {
        return this.scenario.onExitGame();
    }


    onGameOver(): Promise<void> {
        return this.scenario.onGameOver();
    }


    initScenario(data: IScenarioData): Promise<void> {

        this.scenario = new Scenario(this, data);
        return this.onReady();
    }


    onReady(): Promise<void> {
        return this.scenario.onReady();
    }


    initGame(data: IGameData): Promise<void> {
        return this.scenario.initGame(data);
    }


    setStatsVisible(isTrue: boolean): void {
        this.scenario.setStatsVisible(isTrue);
    }


    turn(direction: number) {
        return this.scenario.turn(direction);
    }


    move(direction: number): Promise<any> {
        return this.scenario.move(direction);
    }


    fall(time: number): Promise<any> {
        return this.scenario.fall(time);
    }


    setSize(width: number, height: number): void {
        this.scenario.setSize(width, height);
    }


    goToIntroView(): Promise<void> {
        return this.scenario.goToIntroView();
    }


    goToProfileView(): Promise<void> {
        return this.scenario.goToProfileView();
    }


    goToSkinsView(): Promise<void> {
        return this.scenario.goToSkinsView();

    }


    goToReplaysView(): Promise<void> {
        return this.scenario.goToReplaysView();
    }


    pause(): void {
        this.scenario.pause();
    }


    play(): void {
        this.scenario.play();
    }


    restart(data: IGameData): void {
        this.scenario.restart(data);
    }


    getStatus(): GameStatus {
        return this.scenario.getStatus();
    }


    replay(data: IGameReplayData, delay: number): Promise<void> {
        return this.scenario.replay(data, delay);
    }


    setFog(isTrue: boolean): void {
        this.scenario.setFog(isTrue);
    }


    setCastShadows(isTrue: boolean): void {
        this.scenario.setCastShadows(isTrue);
    }


    setReceiveShadows(isTrue: boolean): void {
        this.scenario.setReceiveShadows(isTrue);
    }


    setAntialias(isTrue: boolean): void {
        this.scenario.setAntialias(isTrue);
    }


    exitGame(): void {
        this.scenario.exitGame();
    }

    private scenario: Scenario;

}

expose(Game);
