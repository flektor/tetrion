import { GameMode } from "src/app/engine/game.interface";
import { ThemeConfig } from "src/app/services/theme/theme.interface";

export enum LobbySubscription {
    PlayerJoined = "PLAYER_JOINDED_LOBBY",
    PlayerLeft = "PLAYER_LEFT_LOBBY",
  }
  
  
  export class ITempGameData {
    rows: number;
    cols: number;
    mode: GameMode.OneVsOne;
    gameId: string;
    passphrase: string;
    indices:number[];
    player: {
      signal: string,
      username: string,
      theme: ThemeConfig
    };
  
  }
  
  
  export enum GameType {
    QuickGame = 'QUICK_GAME',
    ChallengeGame = 'CHALLENGE_GAME',
  }
  
  
  export enum GameMessagingAction {
    WaitForServer = 'WAIT_FOR_SERVER',
    WaitForClient = 'WAIT_FOR_CLIENT',
    OpenOutcomingConnectionRequest = 'OPEN_OUTCOMING_CONNECTION_REQUEST',
    OutcomingConnectionOpened = 'OUTCOMING_CONNECTION_OPENED',
    VerifingConnectionRequest = 'VERIFING_CONNECTION_REQUEST',
    VerifingConnectionResponse = 'VERIFING_CONNECTION_RESPONSE',
    ConnectionEstablished = 'CONNECTION_ESTABLISHED',
    StartGameRequest = 'START_GAME_REQUEST',
    GameCountdown = 'GAME_COUNTDOWN',
    GameCommand = 'GAME_COMMAND',
  }    