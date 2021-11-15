import { AudioConfig } from "../audio/audio-config.interface";
import { FcmConfig } from "../fcm/fcm-config.interface";
import { GameConfig } from "../../engine/game.interface";
import { PeerConfig } from "../peer/peer-config.interface";
import { ThemeConfig } from "../theme/theme.interface";

export interface UserConfig {
    game: GameConfig;
    video: VideoConfig;
    audio: AudioConfig;
    keys: KeysConfig;
    peer: PeerConfig;
    fcm: FcmConfig;
    theme: { active: string, configs: Array<ThemeConfig>, opponentTheme?:string };
    isSubbedInLobby: boolean;
    isGuest:boolean;
    onlineStatus: OnlineStatus.InGame | OnlineStatus.Signaling | OnlineStatus.Lobby | OnlineStatus.None | OnlineStatus.QuickGame;
}


export interface KeysConfig {
    fallDown: string;
    moveLeft: string;
    moveRight: string;
    turnLeft: string;
    turnRight: string;
    back: string
}

export interface VideoConfig {
    hasFog: boolean;
    hasAntialias: boolean;
    showStats: boolean;
    castShadows: boolean;
    receiveShadows: boolean;
}

export interface MultiGameStats {
    games: number;
    wins: number;
    losses: number;
    highScore: number;
    maxLevel: number;
}

export interface SoloGameStats {
    games: number;
    highScore: number;
    maxLevel: number;
}


export interface UserCareerStats {
    solo: SoloGameStats;
    oneVsOne: MultiGameStats;
}


export enum OnlineStatus {
    Lobby = 'LOBBY',
    InGame = 'IN_GAME',
    Signaling = 'SIGNALING',
    None = 'NONE',
    QuickGame = 'QUICK_GAME',
}


export interface GameResult {
    gameConfig: GameConfig;
    score: number;
    gameId: string;
}
