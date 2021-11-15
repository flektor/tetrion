import { GameMode } from "src/app/engine/game.interface";
import { OnlineStatus, UserConfig } from "./user.interface";

export const guestConfig = (): UserConfig => {
    return {
        game: {
            rows: 16,
            cols: 11,
            mode: GameMode.Solo
        },
        audio: {
            isMusicEnabled: false,
            isSoundsEnabled: false,
            musicVolume: 50,
            soundsVolume: 50
        },
        video: {
            hasAntialias: true,
            hasFog: true,
            showStats: true,
            castShadows: true,
            receiveShadows: true
        },
        keys: {
            back: "Escape",
            fallDown: "Space",
            moveLeft: "KeyA",
            moveRight: "KeyD",
            turnLeft: "KeyW",
            turnRight: "KeyS"
        },
        peer: {
            signal: undefined
        },
        fcm: {
            token: undefined,
            hasPermissions: false
        },
        theme: {
            configs: [],
            active: "default", opponentTheme: "red"
        },
        isSubbedInLobby: false,
        isGuest: true,
        onlineStatus: OnlineStatus.None
    }
}

