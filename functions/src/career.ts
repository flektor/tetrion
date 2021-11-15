import * as admin from 'firebase-admin';


export const getPlayerCareer = async (username: string): Promise<UserCareerStats | void> => {
  const user: admin.auth.UserRecord = await admin.auth().getUserByEmail(username + '@tetrion.com');
  return await getPlayerCareerByUid(user.uid);
};


export const updatePlayerCareer = async (data: UpdatePlayerCareerData) => {
  const user: admin.auth.UserRecord = await admin.auth().getUserByEmail(data.username + '@tetrion.com');
  await updatePlayerCareerByUid(user.uid, data);
}


const initialUserCarrerStats = (): UserCareerStats => {
  return {
    oneVsOne: {
      games: 0,
      wins: 0,
      losses: 0,
      highScore: 0,
      maxLevel: 1,
    },
    solo: {
      games: 0,
      highScore: 0,
      maxLevel: 1
    }
  }
}


const getPlayerCareerByUid = async (uid: string): Promise<UserCareerStats | void> => {
  const userData: any = await admin.firestore().collection('users').doc(uid).get();

  if (userData === undefined) return;

  const career = userData.data().career;

  return career ? career : initialUserCarrerStats();
}


const updatePlayerCareerByUid = async (uid: string, data: UpdatePlayerCareerData) => {

  console.log('save player career by id', uid, data)

  const career = await getPlayerCareerByUid(uid);

  console.log(career);

  if (career === undefined) return;

  const level = Math.trunc(data.score / 350) + 1;

  if (data.mode === GameMode.OneVsOne) {


    if (data.win !== undefined) {
      // One Vs One case
      data.win ? career.oneVsOne.wins++ : career.oneVsOne.losses++;
    }

    if (career.oneVsOne.maxLevel < level) {
      career.oneVsOne.maxLevel = level;
    }

    if (career.oneVsOne.highScore < data.score) {
      career.oneVsOne.highScore = data.score;
    }

    career.oneVsOne.games++;


    console.log('save player career', career);
    await admin.firestore().collection('users').doc(uid).update({ career: career });
    return;

  }

  // solo mode

  if (career.solo.maxLevel < level) {
    career.solo.maxLevel = level;
  }

  if (career.solo.highScore < data.score) {
    career.solo.highScore = data.score;
  }

  career.solo.games++;

  await admin.firestore().collection('users').doc(uid).update({ career: career });

}



interface MultiGameStats {
  games: number;
  wins: number;
  losses: number;
  highScore: number;
  maxLevel: number;
}

interface SoloGameStats {
  games: number;
  highScore: number;
  maxLevel: number;
}


interface UserCareerStats {
  solo: SoloGameStats;
  oneVsOne: MultiGameStats;
}


interface UpdatePlayerCareerData {
  username: string;
  mode: GameMode.Solo | GameMode.OneVsOne;
  score: number;
  win?: boolean;
}

export enum GameMode {
  Solo = 'SOLO',
  OneVsOne = '1v1'
}
