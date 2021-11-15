import { Injectable } from "@angular/core";
import { transfer, wrap } from 'comlink';
import { SHA1 } from 'crypto-js';
import { Observable } from 'rxjs/internal/Observable';
import { GameConfig, GameMode, GameResult, GameStatus, IGameData, IGameLoggerData, IGameReplayData, IPlayerGameStats, IPlayerInfo } from 'src/app/engine/game.interface';
import { Scenario } from 'src/app/engine/scenario';
import { GameCommand, GameCommands, GameLogs, GameOver, IndicesRequest, IndicesResponse } from 'src/app/logger/commands';
import { GameLogger } from 'src/app/logger/logger';
import { PeerService } from '../peer/peer.service';
import { IScenario, IScenarioData, Pushable, ScreenPosition } from '../../engine/scenario.interface';
import { HitPoints } from 'src/app/components/sprites/sprite';
import { BehaviorSubject } from 'rxjs';
import { skip } from 'rxjs/internal/operators/skip';
import { ThemeConfig } from '../theme/theme.interface';
import { MeshPhongMaterialParameters } from 'three';
import { EventProps } from 'src/app/offscreen-orbit-controls/offscreen-orbit-controls';
import { BlockType } from 'src/app/engine/shapes/block';
import { LoaderService } from 'src/app/loader/loader.service';
import { AngularFireFunctions } from '@angular/fire/functions';
import { UserService } from "../user/user.service";
import { OnPointsData, OnCommandData, GamePlayerResult, GameResultData, GameIdRequestData } from "./game.interface";
import { GameMessagingAction } from "src/app/pages/play/play-game.interface";



async function createGameWorker(data: IScenarioData, onMessage: (event) => void) {

    const worker = new Worker('../../worker/game.worker', { type: 'module', name: 'game.worker.js' });

    worker.addEventListener('message', e => onMessage(e));

    const workerProxy = wrap<typeof import('../../worker/game.worker').Game>(worker);

    data.stageCanvas = (data.stageCanvas as HTMLCanvasElement).transferControlToOffscreen() as any;
    data.nextBlockStageCanvas = (data.nextBlockStageCanvas as HTMLCanvasElement).transferControlToOffscreen() as any;

    const proxy = await new workerProxy();
    await proxy.initScenario(transfer(data, [data.stageCanvas as any, data.nextBlockStageCanvas as any]));
    return proxy;

}


@Injectable()
export class GameService implements IScenario, Pushable {

    constructor(
        private peer: PeerService,
        private loader: LoaderService,
        private aff: AngularFireFunctions,
        private user: UserService
    ) {
        this.init();
    }



    async init() {
        // this.loadGameSubject = 
        this.loaded = new Promise(async resolve => {

            this.restoreUserData();

            this.onPointsSubject.pipe(skip(1)).subscribe(data => this.addPoints(data));

            this.onCommandSubject.pipe(skip(1)).subscribe(async data => {

                if (data.command.type === GameCommands.IndicesRequest
                    || data.command.type === GameCommands.IndicesResponse) {
                    return;
                }
                this.logger.logCommand(data.username, data.command);
            });


            this.isloaded = true;
            resolve();
        });
    }



    dispatchControlsParentEvent(event: EventProps): void {
        if (this.status === GameStatus.GameOver) {
            this.scenario.dispatchControlsParentEvent(event);
        }
    }


    dispatchControlsEvent(event: EventProps): void {
        if (this.status === GameStatus.GameOver) {
            this.scenario.dispatchControlsEvent(event);
        }
    }


    initOrbitControls(): void {
        this.scenario.initOrbitControls();
    }

    changePlayerTheme(username: string, theme: ThemeConfig): void {
        this.scenario.changePlayerTheme(username, theme);
    }

    async updateGameResult(gameResult: GameResultData) {
        if (this.user.config.isGuest) {
            return;
        }
        await this.aff.httpsCallable('updateGameResult')(gameResult).toPromise();
    }


    async requestNewGame(data: GameIdRequestData): Promise<{ id: string, passphrase?: string }> {
        if (this.user.config.isGuest) {
            return;
        }
        return await this.aff.httpsCallable('requestNewGame')(data).toPromise();
    }


    async getSkinArrowsPosition(index: number): Promise<ScreenPosition> {
        return this.scenario.getSkinArrowsPosition(index);
    }



    // async getNewGameData(params: INewGameParams): Promise<IGameData> {

    //     if (!this.isloaded) {
    //         await this.loaded;
    //     }

    //     const playersInfos: IPlayerInfo[] = new Array();

    //     const usernames: string[] = new Array();

    //     for (const playerinfo of params.playersInfo) {
    //         playersInfos.push({
    //             username: playerinfo.username,
    //             theme: playerinfo.theme,
    //             level: 1,
    //             experience: 0,
    //             levelExperience: 350
    //         });
    //         usernames.push(playerinfo.username);
    //     }

    //     return {
    //         rows: params.config.rows,
    //         cols: params.config.cols,
    //         mode: params.config.mode,
    //         gameId: params.gameId,
    //         playersInfo: playersInfos,
    //         blockTypes: await this.getBlockTypes()
    //     }

    // }


    private blockTypes: BlockType[];

    async getBlockTypes(): Promise<BlockType[]> {

        if (this.blockTypes) return this.blockTypes;

        this.blockTypes = await this.loadBlockTypes();
        return this.blockTypes;
    }

    private async loadBlockTypes(): Promise<BlockType[]> {
        const types = await this.loader.loadJson("assets/block-types.json") as BlockType[];

        for (let i = 0; i < types.length; i++) {
            types[i].index = i;
        }
        return types;
    }


    getPlayersStats(): Map<string, IPlayerGameStats> {
        return this.logger.getPlayersGameStats();
    }


    getSkin(index: number, size: number, materialParams: MeshPhongMaterialParameters[]): Promise<Blob> {
        return this.scenario.getSkin(index, size, materialParams);
    }


    getSkinsNumber(): Promise<number> | number {
        return this.scenario.getSkinsNumber();
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


    nextΤhemeBlock(): Promise<boolean> {
        return this.scenario.nextΤhemeBlock();
    }


    prevΤhemeBlock(): Promise<boolean> {
        return this.scenario.prevΤhemeBlock();
    }


    overrideThemeBlock(index: number): void {
        this.scenario.overrideThemeBlock(index);
    }


    overrideΤhemeBlock(index: number): void {
        this.scenario.overrideThemeBlock(index);
    }


    setThemeBrickGeometry(index: number): void {
        this.scenario.setThemeBrickGeometry(index);
    }


    private stageCanvas: HTMLCanvasElement | OffscreenCanvas;


    async initScenario(data: IScenarioData) {

        await this.onLoad();

        this.config = data.gameData;


        this.stageCanvas = data.stageCanvas;

        // if (true) {
        if (data.useGameWorker) {
            this.scenario = await createGameWorker(data, e => this.onWorkerMessage(e)) as unknown as IScenario;
        } else {
            this.scenario = new Scenario(this, data);
        }

        this.setPlayersInfo(data.gameData.playersInfo);

        await this.initGameLogger(data.gameData);


        // const logs = new Map<string, GameLogs>();
        // const stats = new Map<string, IPlayerGameStats>();

        // for (const player of data.gameData.playersInfo) {
        //     logs.set(player.username, new GameLogs());
        // }

        // for (const player of data.gameData.playersInfo) {
        //     stats.set(player.username, {
        //         level: 1,
        //         experience: 0,
        //         levelExperience: 350,
        //         score: 0,
        //         result: GameResult.None
        //     });
        // }




        // const loggerData: IGameLoggerData = {
        //     mode: data.gameData.mode,
        //     rows: data.gameData.rows,
        //     cols: data.gameData.cols,
        //     duration: '0',
        //     logs: logs,
        //     stats: stats,
        //     title: 'moched game data',
        //     gameId: 'no-id',
        //     date: Date.now()
        // }

        // this.logger = new GameLogger(loggerData);

        await this.scenario.onReady();

        this.onReadySubject.next(true);

    }


    async onReady(): Promise<void> {
        if (this.isReady) return;

        return new Promise(resolve => {
            this.onReadySubject.subscribe(isReady => {
                if (isReady) {
                    resolve();
                }
            });
        });
    }


    pushCommand(username: string, command: GameCommand, peerSend?: boolean) {

        this.onCommandSubject.next({ username, command });

        if (!peerSend) return;

        for (const player of this.playersInfo) {

            if (player.username === username) continue;

            this.peer.send(player.username, {
                type: GameMessagingAction.GameCommand,
                gameId: this.gameId,
                username: username,
                command: command
            });
        }

    }


    pushPoints(username: string, points: HitPoints) {
        this.onPointsSubject.next({ username, points });
    }


    followCommand(username: string, command: GameCommand): void {

        if (command.type === GameCommands.IndicesRequest) {

            const indices = this.genarateIndices((command as IndicesRequest).amount);
            this.pushIndices(indices);
            this.pushCommand(this.playersInfo[0].username, new IndicesResponse(indices), true);
            return;
        }

        if (command.type === GameCommands.IndicesResponse) {
            this.pushIndices((command as IndicesResponse).indices);
            return;
        }

        this.onCommandSubject.next({ username, command });

        this.scenario.followCommand(username, command);
    }


    onPoints(): Observable<OnPointsData> {
        return this.onPointsSubject;
    }


    private onCommand(): Observable<OnCommandData> {
        return this.onCommandSubject;
    }

    onLevel(): Observable<boolean> {
        return this.onLevelUpSubject;
    }


    async onExitGame(): Promise<void> {

        await this.scenario.onExitGame();

        this.pushCommand(this.user.username, new GameOver(), true)

        this.status = GameStatus.Intro;
    }


    gameOver() {

        this.storeLogs();

        const results: GamePlayerResult[] = new Array();

        for (const stats of this.logger.getData().stats.entries()) {
            results.push({ username: stats[0], score: stats[1].score });
        }

        this.updateGameResult({
            gameId: this.logger.getData().gameId,
            results: results
        });

        this.status = GameStatus.GameOver;
    }

    async onGameOver(): Promise<void> {

        await this.scenario.onGameOver();
        this.gameOver();

    }


    onEnterGame(): Observable<boolean> {
        return this.onEnterGameSubject;
    }


    onEnterReplay(): Observable<boolean> {
        return this.onEnterReplaySubject;
    }


    setStatsVisible(isTrue: boolean): void {
        this.scenario.setStatsVisible(isTrue);
    }


    // onPeerData(): Observable<GameCommand> {
    //     return this.peer.onData();
    // }


    private restoreUserData(): void {
        // TODO store all data as GameServiceData in cache and server
        console.error(' TODO FIX restoring local game service data');

        // this.data = {
        //     title: 'untitled',
        //     mode: this.user.config.game.mode,
        //     rows: this.user.config.game.rows,
        //     cols: this.user.config.game.cols,
        //     date: Date.now(),
        //     duration: '0',
        //     logs: new Map(),
        //     results: new Map()
        // } 
    }


    getMode(): GameMode.Solo | GameMode.OneVsOne {
        return this.config.mode;
    }


    setMode(mode: GameMode.Solo | GameMode.OneVsOne) {
        this.config.mode = mode;
    }


    getRows(): number {
        return this.config.rows;
    }


    setRows(rows: number) {
        this.config.rows = rows;
    }


    getCols(): number {
        return this.config.cols;
    }


    setCols(cols: number) {
        this.config.cols = cols;
    }


    private isPaused(): boolean {
        return this.isGamePaused;
    }


    turn(direction: number) {
        this.scenario.turn(direction);
    }


    move(direction: number) {
        this.scenario.move(direction);
    }


    fall(time: number) {
        this.scenario.fall(time);
    }


    setSize(width: number, height: number): void {
        this.scenario.setSize(width, height);
    }


    goToIntroView(): Promise<void> {
        this.status = GameStatus.Intro;
        return this.scenario.goToIntroView();
    }

    goToProfileView(): Promise<void> {
        this.status = GameStatus.Profile;
        return this.scenario.goToProfileView();
    }


    goToSkinsView(): Promise<void> {
        this.status = GameStatus.Skins;
        return this.scenario.goToSkinsView();
    }


    goToReplaysView(): Promise<void> {
        this.status = GameStatus.Replays;
        return this.scenario.goToReplaysView();
    }


    setGameConfig(config: GameConfig) {
        this.scenario.setGameConfig(config);
    }


    async getGameConfig(): Promise<GameConfig> {
        // return this.scenario.getGameConfig();
        return this.config;
    }


    pause(): void {
        this.isGamePaused = true;
        this.scenario.pause();
    }


    play(): void {
        this.isGamePaused = false;
        this.scenario.play();
    }


    private setPlayersInfo(playersInfo: IPlayerInfo[]) {
        this.playersInfo = playersInfo;
    }

    private gameId: string;

    async restart(gameData?: IGameData): Promise<string> {

        if (!gameData) {
            const game = await this.requestNewGame({
                mode: this.config.mode,
                usernames: this.logger.getUsernames()
            });
            gameData.gameId = game.id;
        }

        this.setPlayersInfo(gameData.playersInfo);
        this.setRows(gameData.rows);
        this.setCols(gameData.cols);
        this.setMode(gameData.mode);
        this.gameId = gameData.gameId;

        this.initGameLogger(gameData);

        this.onEnterGameSubject.next(true);
        this.initPlayersStats();
        this.scenario.setGameConfig(this.config);
        this.scenario.restart(gameData);

        this.status = GameStatus.Game;
        this.isGamePaused = false;
        return this.gameId;

    }


    getStatus(): GameStatus {
        return this.status;
    }


    genarateIndices(amount: number): number[] {
        const indices = new Array();

        for (let i = 0; i < amount; i++) {
            indices.push(Math.floor((Math.random() * 7)));
        }

        return indices;
    }


    pushIndices(indices: number[]) {
        this.scenario.pushIndices(indices);
    }


    getGameResult(username: string): GameResult.Win | GameResult.Loss | GameResult.None {
        return this.logger.getGameResult(username);
    }


    async replay(data: IGameReplayData, delay: number) {
        this.status = GameStatus.Replays;
        this.onEnterReplaySubject.next(true);
        await this.scenario.replay(data, delay);
    }


    setFog(isTrue: boolean): void {
        this.scenario.setFog(isTrue);
    }


    setReceiveShadows(isTrue: boolean): void {
        this.scenario.setReceiveShadows(isTrue);
    }


    setCastShadows(isTrue: boolean): void {
        this.scenario.setCastShadows(isTrue);
    }


    setAntialias(isTrue: boolean): void {
        this.stageCanvas.getContext('webgl', { antialias: isTrue })
        this.scenario.setAntialias(isTrue);
    }


    async updateStatus() {
        this.status = await this.scenario.getStatus();
    }

    exitGame(): void {
        this.scenario.exitGame();
    }


    restoreLogsInfo(): Array<IGameLoggerData> | undefined {
        const array: Array<IGameLoggerData> = JSON.parse(localStorage.getItem('game-logs-info'));
        if (!array) {
            return undefined;
        }

        for (let item of array) {
            item.stats = this.objectToMap(item.stats);
        }
        return array;
    }

    restoreLogs(title: string): Map<string, GameLogs> {
        const object = JSON.parse(localStorage.getItem(title));
        return this.objectToMap(object);
    }




    // private initLogger(data?: IGameData) {


    //     const logs: Map<string, GameLogs> = new Map();
    //     const results: Map<string, IPlayerGameResult> = new Map();

    //     if (data) {
    //         this.setData(data);
    //         this.logger = new GameLogger(data);
    //         return;
    //     }

    //     const playersInfo: IPlayerInfo[] = new Array();
    //     for (let player of this.playersInfo) {
    //         logs.set(player.username, new GameLogs())
    //         results.set(player.username, { score: 0, level: 1, result: GameResult.None, });
    //         playersInfo.push({
    //             username: player.username,
    //             theme: player.theme,
    //             level: 1,
    //             levelExpierience: 350,
    //             expierience: 0
    //         });
    //     };
    //     data = {
    //         blockTypes: this.blockTypes,
    //         playersInfo: playersInfo,
    //         title: 'untitled',
    //         date: Date.now(),
    //         duration: '0',
    //         mode: this.mode,
    //         rows: this.rows,
    //         cols: this.cols,
    //         logs: logs,
    //         results: results
    //     }
    //     this.setData(data);

    //     this.logger = new GameLogger(data); 

    // }

    private async initGameLogger(data: IGameData) {

        const logs = new Map<string, GameLogs>();
        const stats = new Map<string, IPlayerGameStats>();
        const usernames = new Array();

        for (const player of data.playersInfo) {
            logs.set(player.username, new GameLogs());
            usernames.push(player.username);
        }

        for (const player of data.playersInfo) {
            stats.set(player.username, {
                level: 1,
                experience: 0,
                levelExperience: 350,
                score: 0,
                result: GameResult.None
            });
        }

        const loggerData: IGameLoggerData = {
            mode: data.mode,
            rows: data.rows,
            cols: data.cols,
            duration: '0',
            logs: logs,
            stats: stats,
            title: 'untitled',
            gameId: data.gameId,
            date: Date.now()
        }

        this.logger = new GameLogger(loggerData);
    }

    private getFirstCommand(username: string): GameCommand {
        return this.logger.getFirstCommand(username);
    }


    private getLastCommand(username: string): GameCommand {
        return this.logger.getLastCommand(username);
    }


    private getLoggerCommands(username: string): Array<GameCommand> {
        return this.logger.getCommands(username);
    }



    private storeLogs(): void {
        this.logger.setGameConfig(this.config);

        this.logger.complete();

        const data = this.logger.getData();

        // data.mode = "1v1" as any;
        // data.results.set('opponent', data.results.get('louster'))
        // data.logs.set('opponent', data.logs.get('louster'))


        const gameLogs = JSON.stringify(this.mapToObject(data.logs))

        const title = 'game-logs-' + SHA1(gameLogs).toString();

        const str = localStorage.getItem('game-logs-info');

        const info: Array<IGameLoggerData> = str ? JSON.parse(str) : new Array();

        if (info.length === 10) {
            localStorage.removeItem(info[0].title)
            info.splice(0, 1); // removes the earliear game-log-info from array
        }

        info.push({
            rows: data.rows,
            cols: data.cols,
            date: data.date,
            duration: data.duration,
            mode: data.mode,
            title: title,
            stats: this.mapToObject(data.stats),
        } as IGameLoggerData);


        console.log('Saving game logs to local storage..');
        localStorage.setItem('game-logs-info', JSON.stringify(info));
        localStorage.setItem(title, gameLogs);

    }


    private mapToObject(map: Map<string, any>): Object {
        const object = new Object();
        map.forEach((value, key) => (object[key] = value));
        return object;
    }


    private objectToMap(object: Object) {
        const map = new Map();
        Object.keys(object).forEach(key => map.set(key, object[key]));
        return map;
    }


    private initPlayersStats(): void {

        for (const [key, stats] of this.getPlayersStats()) {
            stats.level = 1;
            stats.experience = 0;
            stats.levelExperience = 350;
            stats.result = GameResult.None;
            stats.score = 0;
        }

    }


    private onWorkerMessage(event: MessageEvent) {

        if (!event.data.operation) return;

        switch (event.data.operation) {
            case 'points':
                this.onPointsSubject.next({
                    username: event.data.username,
                    points: JSON.parse(event.data.points)
                });
                return;

            case 'command':

                this.onCommandSubject.next({
                    username: event.data.username,
                    command: JSON.parse(event.data.command),

                });
                return;

        }
    }


    private addPoints(data: OnPointsData): void {
        this.logger.logPoints(data.username, data.points);

        const stats = this.logger.getPlayersGameStats().get(data.username);
        stats.experience += data.points.value;

        if (stats.experience > stats.level * 350) {
            this.levelUp(data.username, stats);
        }

    }


    private levelUp(username: string, stats: IPlayerGameStats): void {

        // stats.experience = stats.experience - stats.levelExperience;
        stats.level++;
        stats.levelExperience += 350;

        const falltime = this.initFallTime - stats.level * 100;

        if (falltime > 1500) {
            this.fallTime = falltime;
            // this.scenario.setFallTime(username, falltime);
            console.warn("update scenario player falltime");
        }

        this.onLevelUpSubject.next(true);

    }


    private async onLoad() {
        if (this.isloaded) return;
        return this.loaded;
    }

    // private resetConfig(): void {
    //     const config = this.logger.getData();
    //     this.setMode(config.mode);
    //     this.setRows(config.rows);
    //     this.setCols(config.cols);
    // }


    private playersInfo: IPlayerInfo[];

    private isOrbitControlEnabled = false;

    private initFallTime: number;
    private fallTime: number;

    private logger: GameLogger;
    private config: GameConfig;

    private loaded: Promise<void>;
    private isloaded: boolean = false;
    private isReady: boolean = false;

    private scenario: IScenario;

    private status: GameStatus;

    private isGamePaused: boolean = true;


    private onEnterGameSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private onEnterReplaySubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private onReadySubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private onPointsSubject: BehaviorSubject<OnPointsData> = new BehaviorSubject(null);
    private onCommandSubject: BehaviorSubject<OnCommandData> = new BehaviorSubject(null);
    private onLevelUpSubject: BehaviorSubject<boolean> = new BehaviorSubject(null);


}

