
import { AnimationAction, AnimationClip, AnimationMixer, KeyframeTrack, Object3D, SpotLight, Vector3, Quaternion } from 'three';

export enum Pages {
    Profile = 'Profile',
    Skins = 'Skins',
    Play = "Play"
}


export enum PageTransitionRoots {
    CameraContainer = 'CameraContainer',
    FocusBox = 'FocusBox',
}


export enum Keyframes {
    Board = 0,
    SkinsNarrow = 1,
    SkinsWide = 2,
    ProfileNarrow = 3,
    ProfileWide = 4
}
 

export class Animations {

    clips: Map<string, AnimationClip>;

    constructor(clips: AnimationClip[], private objects: Object3D[]) {
        this.clips = new Map();
        for (const clip of clips) {
            this.clips.set(clip.name, clip);
        }

        this.cameraContainer = this.getObject(PageTransitionRoots.CameraContainer);
        this.focusBox = this.getObject(PageTransitionRoots.FocusBox);

        this.spot = this.getObject('Spot') as SpotLight;
 
    }


    getKeyframes(
        name: Keyframes.Board
            | Keyframes.SkinsNarrow
            | Keyframes.SkinsWide
            | Keyframes.ProfileNarrow
            | Keyframes.ProfileWide
    ): { focusKeyframe: Keyframe, cameraKeyframe: Keyframe } {

        const focusAction = this.clips.get('FocusAction');
        const cameraAction = this.clips.get('CameraAction');

        return {
            focusKeyframe: this.getKeyframe(name, focusAction.tracks),
            cameraKeyframe: this.getKeyframe(name, cameraAction.tracks)
        }
    }


    private getKeyframe(index: number, tracks: KeyframeTrack[]): Keyframe {

        const keyframe: Keyframe = new Object;

        for (const track of tracks) {

            switch (track.name.split('.')[1]) {
                case 'quaternion':
                    keyframe.quaternion = new Quaternion();
                    keyframe.quaternion.set(
                        track.values[4 * index],
                        track.values[4 * index + 1],
                        track.values[4 * index + 2],
                        track.values[4 * index + 3],
                    );
                    break;
                case 'scale':
                    keyframe.scale = new Vector3();
                    keyframe.scale.set(
                        track.values[3 * index],
                        track.values[3 * index + 1],
                        track.values[3 * index + 2]
                    );
                    break;
                case 'position':
                    keyframe.position = new Vector3();
                    keyframe.position.set(
                        track.values[3 * index],
                        track.values[3 * index + 1],
                        track.values[3 * index + 2]
                    );

            }
        }
        return keyframe;
    }


    private getObject(name: string): Object3D | undefined {
        for (const object of this.objects) {
            if (object.name === name) {
                return object;
            }
        }
        return;
    }




    private spot: SpotLight;
    private cameraContainer: Object3D;
    private focusBox: Object3D;
    private activeActions: Map<string, AnimationAction> = new Map();


}


export interface Keyframe {
    scale?: Vector3;
    position?: Vector3;
    quaternion?: Quaternion;
}

export class ObjectAnimation {

    private mixer: AnimationMixer;

    constructor(root: Object3D) {
        this.mixer = new AnimationMixer(root);
    }

    clipAction(clip: AnimationClip): AnimationAction {
        return this.mixer.clipAction(clip);
    }

}


export interface PageTransitionParams {
    fromPage: Pages.Play | Pages.Profile | Pages.Skins;
    toPage: Pages.Play | Pages.Profile | Pages.Skins;
}
