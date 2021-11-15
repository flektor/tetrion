import { HitPoints } from "src/app/components/sprites/sprite";
import { GameConfig, GameMode } from "src/app/engine/game.interface";
import { GameCommand } from "src/app/logger/commands";
import { ThemeConfig } from "../theme/theme.interface";

export interface OnCommandData {
    username: string;
    command: GameCommand;
}

export interface OnPointsData {
    username: string;
    points: HitPoints;
}

export interface GameIdRequestData {
    usernames: string[];
    mode: GameMode.Solo | GameMode.OneVsOne;
}

export interface GameResultData {
    results: GamePlayerResult[];
    gameId: string;
}


export interface INewGameParams {
    gameId?: string
    config: GameConfig;

    playersInfo: Array<{
        username: string,
        theme: ThemeConfig
    }>;
}

export interface GamePlayerResult {
    username: string,
    score: number
}


export interface GameWorkerParams {
    canvas: OffscreenCanvas,
    aspect: number;
}