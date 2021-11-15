import * as admin from 'firebase-admin';
import { GameType, initGame } from './game';


const pickQuickGameOpponent = async (username: string) => {

    const docs = await admin.firestore().collection('lobby').get();
    const users = docs.docs.map(doc => doc.data());

    if (users.length < 2) {
        return;
    }

    let user1: any;
    let user2: any;

    for (const user of users) {
        if (user1 && user2) {
            break;
        }

        if (!user1 && user.username === username) {
            user1 = user;
            continue;
        }

        if (!user2 && user.status === "QUICK_GAME") {
            user2 = user;
        }
    }

    if (!user1 || !user2) {
        // opponent not found, there is no other player searching for QUICK_GAME.
        return;
    }

    // opponent found 
    return {
        user1: user1,
        user2: user2
    }

}


export const quickGame = async (data: IUserData) => {

    const users = await pickQuickGameOpponent(data.username);
    if (!users) return;

    await initGame(GameType.QuickGame, users);

}



export interface IUserData {
    username: string;
    signal: string;
}
