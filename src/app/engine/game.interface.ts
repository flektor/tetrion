import { BlockType } from 'src/app/engine/shapes/block';
import { GameLogs } from "src/app/logger/commands";
import { ThemeConfig } from '../services/theme/theme.interface';

export enum GameStatus {
    Intro = 'INTRO',
    Skins = 'SKINS',
    Profile = 'PROFILE',
    Replays = 'REPLAYS',
    Game = 'GAME',
    Restart = 'RESTART',
    GameOver = 'GAME_OVER'
}


export enum GameMode {
    Solo = 'SOLO',
    OneVsOne = '1v1'
}


export enum GameResult {
    Win = 'WIN',
    Loss = 'LOSS',
    None = '-',
}


export interface IPlayerInfo {
    username: string;
    theme: ThemeConfig;
    level: number;
    levelExperience: number;
    experience: number;
}


export interface IPlayerGameStats {
    score: number;
    level: number;
    experience: number;
    levelExperience: number;
    result: GameResult.Win | GameResult.Loss | GameResult.None;
}


export interface IGameLoggerData extends GameConfig {
    date: number;
    duration: string;
    title: string;
    logs: Map<string, GameLogs>;
    stats: Map<string, IPlayerGameStats>;
    gameId:string;
}


export interface IGameReplayData {
    gameData: IGameData;
    gameLoggerData: IGameLoggerData;
}

export interface IGameData extends GameConfig {
    gameId: string;
    playersInfo: IPlayerInfo[];
    blockTypes: BlockType[];
    indices?: number[];
}


export interface GameConfig {
    rows: number;
    cols: number;
    mode: GameMode.Solo | GameMode.OneVsOne;
}
