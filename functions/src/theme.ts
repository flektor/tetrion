import * as admin from 'firebase-admin';  


export const getUserTheme = async (username: string): Promise<ThemeConfig> => {

    const user: admin.auth.UserRecord = await admin.auth().getUserByEmail(username + '@tetrion.com');
    const userData: any = await admin.firestore().collection('users').doc(user.uid).get();

    const defaultTheme = {
        bricks: [],
        custom: false,
        name: 'default'
    };

    if (userData === undefined) return defaultTheme;

    const theme = userData.data().theme;

    if (!theme) return defaultTheme;


    for (const config of theme.configs) {
        if (config.name === theme.active) {
            return config;

        }
    }

    defaultTheme.name = theme.active ? theme.active : 'default';
    return defaultTheme;

}


export interface BrickConfig {
    materialsParams: any[];
    geometryIndex: number;
}


export interface ThemeConfig {
    name: string;
    bricks: Array<BrickConfig>;
    custom: boolean;
}
