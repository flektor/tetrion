import admin = require("firebase-admin");
import { initGame, GameType } from './game'


const pickPlayers = async (username1: string, username2: string) => {

    const docs = await admin.firestore().collection('lobby').get();
    const users = docs.docs.map(doc => doc.data());

    if (users.length < 2) {
        return;
    }

    let user1: any;
    let user2: any;

    for (const user of users) {

        if (!user1 && user.username === username1) {
            user1 = user;
            if (user2) break;
        }
        if (!user2 && user.username === username2) {
            user2 = user;
            if (user1) break;
        }

    }

    // if a player is not found, return.
    if (!user1 || !user2) return;


    // players found 
    return {
        user1: user1,
        user2: user2
    }

}





export const challengePlayer = async (request: IChallengePlayerRequest) => {

    let title: string;
    let body: string;
 

    switch (request.type) {

        case RequestType.GameChallenge:
            title = 'Game Challenge';
            body = `${request.username1} challenged you`;
            break;

        case RequestType.ChallengeAccepted:
            title = 'Challenge Accepted';
            body = `Challenge Accepted by ${request.username2}`;
            break;

        case RequestType.ChallengeDeclined:
            title = 'Challenge Declined';
            body = `Challenge Declined by ${request.username2}`;
            break;

        case RequestType.GameSignaling:
            const users = await pickPlayers(request.username1, request.username2);
            if (!users) return;

            await initGame(GameType.ChallengeGame, users);
            return;

        default:
            title = 'Error';
            body = 'Error';
    }

    const user2: admin.auth.UserRecord = await admin.auth().getUserByEmail(request.username2 + '@tetrion.com');
    const userData: any = await admin.firestore().collection('users').doc(user2.uid).get();
    if (userData === undefined) return;

    const data: admin.messaging.DataMessagePayload = {
        type: request.type,
        username1: request.username1,
        username2: request.username2,
    }

    if (request.signal) {
        data.signal = request.signal;
    }

    const notification: admin.messaging.Notification = { title: title, body: body };

    const payload: admin.messaging.Message = {
        notification: notification,
        token: userData.data().fcm.token,
        data: data
    }

    return admin.messaging().send(payload);
    // return admin.messaging().sendToDevice(data.data().token, payload);
}

enum RequestType {
    ChallengeAccepted = 'CHALLENGE_ACCEPTED',
    ChallengeDeclined = 'CHALLENGE_DECLINED',
    GameSignaling = 'GAME_SIGNALING',
    GameChallenge = 'GAME_CHALLENGE',
}

interface IChallengePlayerRequest {
    type: RequestType
    username1: string;
    username2: string;
    signal?: string;
}
