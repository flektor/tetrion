import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Region } from './consts';
import * as game from './game';
import { IUserData, quickGame } from './quick-game';
import { challengePlayer } from './challenge-game';
import * as lobby from './lobby';
import * as career from './career';
import * as theme from './theme';

admin.initializeApp();




export const continueAsGuest = functions.region(Region.EuropeWest1).https.onCall(async (data: IUserData) => {
  return data;
});



export const wakeUp = functions.region(Region.EuropeWest1).https.onCall(async (data: IUserData) => "You are connected");

export const quickGameRequest = functions.region(Region.EuropeWest1).https.onCall(async (data: IUserData) => quickGame(data));

export const challengePlayerRequest = functions.region(Region.EuropeWest1).https.onCall(async (data: any) => challengePlayer(data));

export const outcomingConnectionOpened = functions.region(Region.EuropeWest1).https.onCall(async (data: { gameId: string; username: string; }) => game.outcomingConnectionOpened(data));

export const connectionEstablished = functions.region(Region.EuropeWest1).https.onCall(async (data: { gameId: string; passphrase: string; username: string; }) => game.connectionEstablished(data));

export const subscribeToLobby = functions.region(Region.EuropeWest1).https.onCall(async (data: { token: string; }) => lobby.subscribe(data));

export const unsubscribeFromLobby = functions.region(Region.EuropeWest1).https.onCall(async (data: { token: string; }) => lobby.unsubscribe(data));

export const getPlayersInLobby = functions.region(Region.EuropeWest1).https.onCall(async () => lobby.getPlayers());

export const updateGameResult = functions.region(Region.EuropeWest1).https.onCall(async (data: game.GameResultData) => game.updateGameResult(data));

export const requestNewGame = functions.region(Region.EuropeWest1).https.onCall(async (data: game.GameIdRequestData) => game.requestNewGame(data));

export const getPlayerCareer = functions.region(Region.EuropeWest1).https.onCall(async (username: string) => career.getPlayerCareer(username));

export const getPlayerTheme = functions.region(Region.EuropeWest1).https.onCall(async (username: string) => theme.getUserTheme(username));


export const sendOnPlayerSubscribed = functions.region(Region.EuropeWest1).firestore
  .document('lobby/{lobbyId}').onCreate(async (snapshot: any) => lobby.onSubscribe(snapshot));

export const sendOnPlayerUnsubscribed = functions.region(Region.EuropeWest1).firestore
  .document('lobby/{lobbyId}').onDelete(async (snapshot: any) => lobby.onUnsubscribe(snapshot));


