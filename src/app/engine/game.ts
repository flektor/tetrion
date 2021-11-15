import { BehaviorSubject, Observable, of } from 'rxjs';
import { skip } from 'rxjs/operators';
import { BlockType } from 'src/app/engine/shapes/block';
import { GameConfig, GameMode, IGameData, IPlayerInfo } from './game.interface';


export class Game implements IGame {

    constructor(private data?: IGameData) {
        if (data) {
            this.setData(data);
        }
    }


    getData(): IGameData {
        return this.data;
    }


    async init() {
        this.loaded = new Promise(async resolve => {
            await this.initGame();
            this.isLoaded = true;
            resolve(true);
        });
    }


    async initGame(data?: IGameData) {

        await this.onLoad();

        if (data) {
            this.setData(data);
        }

        // console.log(this.playersInfo, data.playersInfo)
        this.initPlayersGameStats();


        // this.initLogger(data);

        // this.resetConfig();

        this.speed = 1;
        this.fallTime = this.initFallTime;

        if (this.indices) {
            this.currIndex = this.indices.pop();
            this.nextIndex = this.indices.pop();
            return;
        }

        this.currIndex = Math.floor((Math.random() * 7));
        this.nextIndex = Math.floor((Math.random() * 7));

    }


    getConfig(): GameConfig {
        return {
            cols: this.cols,
            rows: this.rows,
            mode: this.mode
        }
    }


    getCurrIndex(): number {
        return this.currIndex;
    }


    getNextIndex(): number {
        return this.nextIndex;
    }


    nextMove(): void {

        this.currIndex = this.nextIndex;

        if (!this.indices) {
            this.nextIndex = Math.floor((Math.random() * 7));
            return;
        }

        this.nextIndex = this.indices.pop();

        if (!this.indicesRequested && this.indices.length < 5) {
            this.indicesRequested = true;
            this.onIndicesRequestSubject.next(null);
        }
    }


    onIndicesRequest(): Observable<void> {
        return this.onIndicesRequestSubject.pipe(skip(1));
    }


    pushIndices(indices: number[]): void {
        indices.concat(this.indices);
        this.indices = indices;
        this.indicesRequested = false; 
    }


    getFallTime(): number {
        return this.fallTime;
    }


    setFallTime(fallTime: number): void {
        this.fallTime = fallTime;
    }


    getInitFallTime(): number {
        return this.initFallTime;
    }


    getSpeed(): number {
        return this.speed;
    }


    setSpeed(speed: number): void {
        this.speed = speed;
    }


    getBlockTypes(): Array<BlockType> {
        return this.blockTypes;
    }


    getBlockType(index: number): BlockType {
        return this.blockTypes[index];
    }


    getMode(): GameMode.Solo | GameMode.OneVsOne {
        return this.mode;
    }


    setMode(mode: GameMode.Solo | GameMode.OneVsOne) {
        this.mode = mode;
    }


    getRows(): number {
        return this.rows;
    }


    setRows(rows: number) {
        this.rows = rows;
    }


    getCols(): number {
        return this.cols;
    }


    setCols(cols: number) {
        this.cols = cols;
    }


    setPlayerInfo(playersInfo: Array<IPlayerInfo>): void {
        this.playersInfo = playersInfo;
    }


    getPlayers(): Array<IPlayerInfo> {
        return this.playersInfo;
    }


    getPlayer(index: number): IPlayerInfo {
        return this.playersInfo[index];
    }


    getPlayerByName(username: string): IPlayerInfo {
        for (let player of this.playersInfo) {
            if (player.username === username) {
                return player;
            }
        }
    }


    private setData(game: IGameData) {
        this.cols = game.cols;
        this.rows = game.rows;
        this.mode = game.mode;
        this.blockTypes = game.blockTypes;
        this.playersInfo = game.playersInfo;
        this.indices = game.indices;
    }


    private async onLoad() {
        if (this.isLoaded) return;
        return this.loaded;
    }


    private initPlayersGameStats() {
        for (const player of this.playersInfo) {
            player.level = 1;
            player.levelExperience = player.level * 350;
            player.experience = 0;

        }
    }


    // private resetConfig(): void {
    //     const config = this.logger.getData();
    //     this.setMode(config.mode);
    //     this.setRows(config.rows);
    //     this.setCols(config.cols);
    // }


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

    private indicesRequested: boolean = false;
    private onIndicesRequestSubject = new BehaviorSubject(null);
    private indices: number[] = new Array();

    private currIndex: number;
    private nextIndex: number;
    // private logger: GameLogger;

    private blockTypes: Array<BlockType>;
    private playersInfo: Array<IPlayerInfo>;

    private speed: number = 1;
    private readonly initFallTime: number = 4000;
    private fallTime: number = this.initFallTime;

    private rows: number;
    private cols: number;
    private mode: GameMode;
    // public pool: Pool;

    private loaded: Promise<any>;
    private isLoaded: boolean = false;

}


export interface IGame {

    getCurrIndex(): number;

    getNextIndex(): number;

    getCols(): number;

    getRows(): number;

    getMode(): GameMode;

    getConfig(): GameConfig;

    getFallTime(): number;

    getBlockTypes(): BlockType[];

    getPlayer(index: number): IPlayerInfo;

}
