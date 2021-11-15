import * as admin from "firebase-admin";
import { SHA1 } from 'crypto-js';
import * as career from './career';
import * as theme from './theme';


const initNewGame = async (users: { user1: any, user2: any }) => {

    if (!users) return;

    const user1 = users.user1;
    const user2 = users.user2;


    if (user1.gameId !== undefined) {
        await admin.firestore().collection('games').doc(user1.gameId).delete();
    }

    if (user2.gameId !== undefined && user1.gameId !== user2.gameId) {
        await admin.firestore().collection('games').doc(user2.gameId).delete();
    }

    return await requestNewGame({
        mode: career.GameMode.OneVsOne,
        usernames: [user1.username, user2.username],
    });
}


export const initGame = async (type: GameType.ChallengeGame | GameType.QuickGame, users: any) => {
  
    const game = await initNewGame(users);
    if (!game) return;

    const user1 = users.user1;
    const user2 = users.user2;

    const rows = 15;
    const cols = 8;

    const payload1: admin.messaging.Message = {
        notification: {
            title: 'Game Found',
            body: 'Wait for server'
        },
        token: user1.token,
        data: {
            type: type,
            action: GameMessagingAction.WaitForServer,
            gameData: JSON.stringify({
                gameId: game.id,
                rows: rows,
                cols: cols,
                mode: GameMode.OneVsOne,
                player: {
                    username: user2.username,
                    signal: user2.signal,
                },
            } as IGameData)
        }
    }


    if (!await admin.messaging().send(payload1)) return;


    const payload2: admin.messaging.Message = {
        notification: {
            title: 'Game Found',
            body: 'Conecting with ' + user1.username
        },
        token: user2.token,
        data: {
            type: type,
            action: GameMessagingAction.OpenOutcomingConnectionRequest,
            gameData: JSON.stringify({
                gameId: game.id,
                passphrase: game.passphrase,
                rows: rows,
                cols: cols,
                mode: GameMode.OneVsOne,
                player: {
                    username: user1.username,
                    signal: user1.signal,
                }
            } as IGameData)
        }
    }


    return admin.messaging().send(payload2);
}


export const requestNewGame = async (data: GameIdRequestData): Promise<{ id: string, passphrase?: string }> => {
    const doc: IGameDocument = {
        mode: data.mode,
        finished: false,
        player1: { username: data.usernames[0] },
    }


    if (data.usernames.length === 2) {
        doc.player2 = { username: data.usernames[1] };
        doc.passphrase = await genarateGamePassphrase(data.usernames)
    }

    return {
        id: (await admin.firestore().collection('games').add(doc)).id,
        passphrase: doc.passphrase
    };
};


export const updateGameResult = async (params: GameResultData) => {

    if (params.results.length === 1) {
        await updateSoloGameResult(params);
    } else if (params.results.length === 2) {
        await updateMultiGameResult(params);
    }

};

const areResultsMatching = (result1: {
    player1: GamePlayerResult,
    player2: GamePlayerResult
},
    result2: {
        player1: {
            username: string,
            score?: number,
            opponentScore?: number
            result?: 'Win' | 'Loss' | 'None'
        },
        player2: {
            username: string,
            score?: number,
            opponentScore?: number,
            result?: 'Win' | 'Loss' | 'None'
        }
    },

): boolean => {

    if ((result1.player1.result === 'Win' && result1.player2.result !== 'Loss')
        || (result1.player1.result === 'Loss' && result1.player2.result !== 'Win')
        || (result1.player1.result === 'None' && result1.player2.result !== 'None')
    ) {
        return false;
    }

    const text1 = result1.player1.username + result1.player1.score + result1.player2.username + result1.player2.score;

    let part1 = result2.player1.username + result2.player1.score;

    let part2 = result2.player2.username + result2.player1.opponentScore;

    let text2 = part1 + result2.player2.username + result2.player1.opponentScore;

    if (text1 === text2) return true;


    text2 = part2 + part1;

    if (text1 === text2) return true;


    part1 = result2.player2.username + result2.player2.score;
    part2 = result2.player1.username + result2.player2.opponentScore;

    text2 = part1 + part2;

    if (text1 === text2) return true;


    text2 = part2 + part1;

    if (text1 === text2) return true;

    return false;
}

const updateMultiGameResult = async (data: GameResultData) => {

    const game = await getGameDoc(data.gameId);

    if (!game) {
        console.error('Game Not Found', { gameId: data.gameId })
        return;
    }

    if (!game.player2) return;


    const player1 = data.results[0];
    const player2 = data.results[1];


    if (game.finished) {

        const isTrue = areResultsMatching({ player1, player2 }, { player1: game.player1, player2: game.player2 });

        if (!isTrue) {
            await deleteGameDoc(data.gameId);
            throw new Error('Game Result Mismatch!');
        }

        const player1Won: boolean = player1.result === 'Win' ? true : false;

        await career.updatePlayerCareer({
            mode: career.GameMode.OneVsOne,
            username: player1.username,
            score: player1.score,
            win: player1Won
        });

        await career.updatePlayerCareer({
            mode: career.GameMode.OneVsOne,
            username: player2.username,
            score: player2.score,
            win: !player1Won
        });

        await deleteGameDoc(data.gameId);
        return;
    }


    if (player1.username === game.player1.username) {
        game.player1.score = player1.score;
        game.player1.opponentScore = player2.score;
    } else {
        game.player2.score = player1.score;
        game.player2.opponentScore = player2.score;
    }

    game.finished = true;

    await admin.firestore().collection('games').doc(data.gameId).update(game);

}


export const getGameDoc = async (id: string): Promise<IGameDocument> => {
    return (await admin.firestore().collection('games').doc(id).get()).data() as IGameDocument;
}


const deleteGameDoc = async (id: string): Promise<void> => {
    await admin.firestore().collection('games').doc(id).delete();
}


const updateSoloGameResult = async (result: GameResultData) => {

    const game = await getGameDoc(result.gameId);

    if (!game) {
        console.error('Game Not Found', { gameId: result.gameId })
        return;
    }

    await career.updatePlayerCareer({
        mode: career.GameMode.Solo,
        score: result.results[0].score,
        username: result.results[0].username
    });

    await deleteGameDoc(result.gameId);

}

const genarateGamePassphrase = async (usernames: string[]): Promise<string> => {
    let id = Date.now() + '';
    for (const username of usernames) {
        id += username;
    }
    id += Math.random() * 1000;

    return SHA1(id).toString();
}



export const outcomingConnectionOpened = async (data: { gameId: string, username: string }) => {
    const game = await getGameDoc(data.gameId);

    if (!game) {
        console.error('Game Not Found', { gameId: data.gameId })
        return;
    }

    let username;

    if (!game.player2) return;

    if (game.player1.username === data.username) {
        // await admin.firestore().collection('games').doc(data.gameId).update({ 'player1.status': 'READY' });
        username = game.player2.username;

    } else if (game.player2.username === data.username) {

        // await admin.firestore().collection('games').doc(data.gameId).update({ 'player2.status': 'READY' });
        username = game.player1.username;

    } else {
        throw new Error('player not found');
    }


    const user: admin.auth.UserRecord = await admin.auth().getUserByEmail(username + '@tetrion.com');
    const userData: any = await admin.firestore().collection('users').doc(user.uid).get();

    if (userData === undefined) return;


    const payload: admin.messaging.Message = {
        notification: {
            title: 'Game Ready',
            body: 'Game Ready'
        },
        token: userData.data().fcm.token,
        data: {
            type: GameType.QuickGame,
            action: GameMessagingAction.OpenOutcomingConnectionRequest,
            gameId: data.gameId
        }
    }

    await admin.messaging().send(payload);

}


export const connectionEstablished = async (data: { gameId: string, passphrase: string, username: string }) => {
    const game = await getGameDoc(data.gameId);

    if (!game) {
        throw new Error('Game Not Found, id: ' + data.gameId);
    }

    if (game.passphrase !== data.passphrase) {
        throw new Error('Game passphrase mismatch!');
    }


    let username1;
    let username2;

    if (!game.player2) return;

    if (game.player1.username === data.username) {
        // await admin.firestore().collection('games').doc(data.gameId).update({ 'player1.status': 'READY' });
        username1 = game.player2.username;
        username2 = game.player1.username;

    } else if (game.player2.username === data.username) {

        // await admin.firestore().collection('games').doc(data.gameId).update({ 'player2.status': 'READY' });
        username1 = game.player1.username;
        username2 = game.player2.username;

    } else {
        throw new Error('player not found');
    }


    const user1: admin.auth.UserRecord = await admin.auth().getUserByEmail(username1 + '@tetrion.com');
    const userData1: any = await admin.firestore().collection('users').doc(user1.uid).get();

    if (userData1 === undefined) return;


    const payload1: admin.messaging.Message = {
        notification: {
            title: 'Game Ready',
            body: 'Game Ready'
        },
        token: userData1.data().fcm.token,
        data: {
            type: GameType.QuickGame,
            action: GameMessagingAction.WaitForClient,
            gameData: JSON.stringify({
                gameId: data.gameId,
                player: {
                    username: username2,
                    theme: await theme.getUserTheme(username2)
                }
            })

        }
    }

    if (!await admin.messaging().send(payload1)) return;

    const user2: admin.auth.UserRecord = await admin.auth().getUserByEmail(username2 + '@tetrion.com');
    const userData2: any = await admin.firestore().collection('users').doc(user2.uid).get();

    if (userData2 === undefined) return;


    const payload2: admin.messaging.Message = {
        notification: {
            title: 'Game Ready',
            body: 'Game Ready'
        },
        token: userData2.data().fcm.token,
        data: {
            type: GameType.QuickGame,
            action: GameMessagingAction.StartGameRequest,
            gameData: JSON.stringify({
                gameId: data.gameId,
                player: {
                    username: username1,
                    theme: await theme.getUserTheme(username1)
                }
            })
        }
    }

    await admin.messaging().send(payload2);

}



export interface GameIdRequestData {
    usernames: string[];
    mode: career.GameMode.Solo | career.GameMode.OneVsOne;
}


export interface GameResultData {
    results: GamePlayerResult[];
    gameId: string;
}


interface GamePlayerResult {
    username: string,
    score: number
    result: 'Win' | 'Loss' | 'None';
}


interface IGameDocumentPlayer {
    username: string;
    score?: number;
    opponentScore?: number;
}


interface IGameDocument {
    mode: career.GameMode.OneVsOne | career.GameMode.Solo;
    finished: boolean;
    passphrase?: string;

    player1: IGameDocumentPlayer;
    player2?: IGameDocumentPlayer;
}


export enum GameMode {
    Solo = 'SOLO',
    OneVsOne = '1v1'
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
    VerifingConnection = 'VERIFING_CONNECTION',
    ConnectionEstablished = 'CONNECTION_ESTABLISHED',
    StartGameRequest = 'START_GAME_REQUEST',
}


export interface IPlayerInfo {
    username: string;
    theme: theme.ThemeConfig;
    signal: string;
}



export interface IGameData {
    gameId: string;
    player: IPlayerInfo;
    rows: number;
    cols: number;
    mode: GameMode.Solo | GameMode.OneVsOne;
    passphrase?: string;
}
