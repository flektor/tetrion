
import * as admin from 'firebase-admin';


export const getPlayers = async (): Promise<{ username: string }[]> => {
    const docs = await admin.firestore().collection('lobby').get();
    const users = new Array();
    for (const user of docs.docs.map(doc => doc.data())) {
        if (user.status === "LOBBY"
            || user.status === "QUICK_GAME"
        ) {
            users.push({
                username: user.username
            })
        }
    }
    return users;
}

export const subscribe = async (data: { token: string }) => {
    await admin.messaging().subscribeToTopic(data.token, 'lobby');
    return 'Subscribed to lobby';
}

export const unsubscribe = async (data: { token: string }) => {
    await admin.messaging().unsubscribeFromTopic(data.token, 'lobby');
    return 'Unsubscribed from lobby';
}

export const onSubscribe = async (snapshot: any) => {
    const payload: admin.messaging.Message = {
        topic: 'lobby',
        data: {
            type: LobbySubscription.PlayerJoined,
            username: snapshot.data().username,
        }
    };
    await admin.messaging().send(payload);
}

export const onUnsubscribe = async (snapshot: any) => {
    const payload: admin.messaging.Message = {
        topic: 'lobby',
        data: {
            type: LobbySubscription.PlayerLeft,
            username: snapshot.data().username,
        }
    };
    await admin.messaging().send(payload);
}


export const isUsernameAvailable = async (username: string) => {
    return (await getPlayers()).includes({ username }) ? false : true;
}

export const pickGuestNickname = async (username: string) : Promise<boolean> => {

    if (! await isUsernameAvailable(username)) {
        return false;
    }
 
    return true;
}


enum LobbySubscription {
    PlayerJoined = "PLAYER_JOINDED_LOBBY",
    PlayerLeft = "PLAYER_LEFT_LOBBY",
}



export interface ITopicSubscription {
    token: string;
    topic: string;
    // region: Region.EuropeWest1;
}