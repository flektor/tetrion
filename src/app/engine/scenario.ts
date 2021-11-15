import { PerspectiveCamera, GridHelper, DirectionalLight, AmbientLight, SpotLight, Color, Vector3, WebGLRendererParameters, Group, MeshPhongMaterialParameters, AnimationClip, Object3D, Clock, LoopRepeat, PCFShadowMap, PointLight, BoxHelper, BoxBufferGeometry, Mesh, AnimationAction, Camera, Box3 } from 'three';
import { BehaviorSubject } from 'rxjs';
import { skip } from 'rxjs/operators';
import { Tweens } from 'src/app/engine/tweens';
import { Engine, MoveCompleted } from 'src/app/engine/engine';
import { AddBlock, MoveBlock, GameOver, CompletedRows, NextBlock, MoveBlockAction, GameCommand, GameCommands, IndicesRequest } from 'src/app/logger/commands';
import { GameConfig, GameMode, GameStatus, IGameData, IGameReplayData, IPlayerInfo } from 'src/app/engine/game.interface';
import { GeometryLoader } from 'src/app/engine/geometry';
import { HitPoints } from 'src/app/components/sprites/sprite';
import { VideoConfig } from 'src/app/services/user/user.interface';
import { ThemeConfig } from 'src/app/services/theme/theme.interface';
import { EventProps, OffscreenOrbitControls } from 'src/app/offscreen-orbit-controls/offscreen-orbit-controls';
import { ElementLike, ElementListener } from 'src/app/offscreen-orbit-controls/event-listener';
import { ScreenPosition, IScenario, IScenarioData, Pushable, SkinEditable } from './scenario.interface';
import { SimpleStage } from './simple-stage';
import { SkinsEditor } from './skins-editor';
import { Game } from './game';
import { Animations, Keyframe, Keyframes, Pages, PageTransitionParams, PageTransitionRoots } from './page-transitions';
import { CameraAdjuster } from './camera-adjuster';

export class Scenario implements IScenario {


    constructor(private pusher: Pushable, data?: IScenarioData) {
        this.ready = new Promise(async resolve => {
            await this.init(data);
            this.isReady = true;

            resolve();
        });
    }
    onReady(): Promise<void> {
        if (this.isReady) return;
        return this.ready;
    }


    // getSkins(size: number, antialias: boolean, materialParams: MeshPhongMaterialParameters[]): Promise<Blob[]> {
    //     return this.skinsEditor.getSkins(size, antialias, materialParams);
    // }

    followCommand(username: string, command: GameCommand): void | MoveCompleted {

        for (let i = 0; i < this.game.getPlayers().length; i++) {
            const player = this.game.getPlayers()[i];
            if (username === player.username) {
                const result = this.engine.followCommand(i, command);
                if (!result) return;

                this.addPoints(player, result.hitPoints, result.isMatrixClear);

                return;
            }
        }
    }


    getSkin(index: number, size: number, materialParams: MeshPhongMaterialParameters[]): Promise<Blob> {
        return this.skinsEditor.getSkin(index, size, materialParams);
    }


    getSkinsNumber(): number | Promise<number> {
        return this.skinsEditor.getSkinsNumber();
    }


    setThemePrimaryColor(color: string | number): void {
        this.skinsEditor.setThemePrimaryColor(color);
    }


    setThemeSecondaryColor(color: string | number): void {
        this.skinsEditor.setThemeSecondaryColor(color);
    }


    setTheme(config: ThemeConfig): void {
        this.skinsEditor.setTheme(config);
    }


    nextΤhemeBlock(): Promise<boolean> {
        return this.skinsEditor.nextΤhemeBlock();
    }


    prevΤhemeBlock(): Promise<boolean> {
        return this.skinsEditor.prevΤhemeBlock();
    }


    setThemeBrickGeometry(index: number): void {
        this.skinsEditor.setThemeBrickGeometry(index);
    }


    overrideThemeBlock(index: number): void {
        this.skinsEditor.overrideThemeBlock(index);
    }

    changePlayerTheme(username: string, theme: ThemeConfig): void {
        this.game.getPlayerByName(username).theme = theme;
        this.engine.initPlayers();
    }


    turn(direction: number) {

        if (!this.canMove) return;

        const tweens = this.engine.turn(this.playerIndex, direction);

        if (!tweens) {
            this.next();
            return;
        }

        if (!tweens.rotateTween) {
            tweens.resumeTween.onComplete(() => this.next());
            return;
        }

        this.canMove = false;

        const command = new MoveBlock({
            action: direction === 1 ? MoveBlockAction.TurnRight : MoveBlockAction.TurnLeft,
            startPos: tweens.rotateTween._valuesStart,
            endPos: tweens.rotateTween._valuesEnd,
            duration: tweens.rotateTween._duration
        });

        this.pushCommand(this.getPlayer().username, command, true);

        tweens.rotateTween.onComplete(() => {
            this.canMove = true;
        });

        if (tweens.fallTween) {
            tweens.fallTween.onComplete(() => this.next());
        }

    }


    move(direction: number): Promise<any> {

        if (!this.canMove) return;

        const tweens = this.engine.move(this.playerIndex, direction);
        if (!tweens) {
            this.next();
            return;
        }

        if (!tweens.moveTween) {
            tweens.resumeTween.onComplete(() => this.next());
            return;
        }

        this.canMove = false;

        tweens.moveTween.onComplete(() => { this.canMove = true });

        const command = new MoveBlock({
            action: direction === 1 ? MoveBlockAction.MoveRight : MoveBlockAction.MoveLeft,
            startPos: tweens.moveTween._valuesStart,
            endPos: tweens.moveTween._valuesEnd,
            duration: tweens.moveTween._duration
        });

        this.pushCommand(this.getPlayer().username, command, true);
        if (tweens.fallTween) {
            tweens.fallTween.onComplete(() => this.next());
        }

    }


    pushCommand(username: string, command: GameCommand, peerSend?: boolean) {
        this.pusher.pushCommand(username, command, peerSend);

        if (username === this.getPlayer().username
            && command.type !== GameCommands.IndicesRequest
            && command.type !== GameCommands.IndicesResponse) {
            this.lastUserCommands = command
        }

        return;
    }


    pushPoints(username: string, points: HitPoints) {
        this.pusher.pushPoints(username, points);
        return;
    }


    fall(time: number): Promise<any> {

        if (this.getStatus() === GameStatus.Game && !this.canMove) {
            return;
        }


        switch (this.getStatus()) {
            case GameStatus.GameOver:
            case GameStatus.Intro:

                this.engine.addIntroBlock(-10, this.game.getRows() + 5);

                const command: any = new MoveBlock({
                    action: MoveBlockAction.Fall,
                    startPos: new Vector3(),
                    endPos: new Vector3(),
                    duration: 0
                });

                this.pushCommand(this.getPlayer().username, command, true);
                return;
        }

        if (
            this.lastUserCommands instanceof MoveBlock
            && this.lastUserCommands.action === MoveBlockAction.Fall
            && this.lastUserCommands.duration
        ) {
            return;
        }

        const tweens = this.engine.fall(this.playerIndex, { time: time });

        if (!tweens) {
            this.next();
            return;
        }

        const command = new MoveBlock({
            action: MoveBlockAction.Fall,
            startPos: tweens.fallTween._valuesStart,
            endPos: tweens.fallTween._valuesEnd,
            duration: tweens.fallTween._duration
        });

        if (this.getStatus() !== GameStatus.Replays) {
            this.pushCommand(this.getPlayer().username, command, true);
        }

        tweens.fallTween.onComplete(() => this.next());
    }


    setSize(width: number, height: number): void {
        this.stage.setSize(width, height);

        const camera = this.controls.object as PerspectiveCamera;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        switch (this.getStatus()) {
            case GameStatus.Game:
            case GameStatus.GameOver:
            case GameStatus.Intro:
            case GameStatus.Replays:

                this.cameraAdjuster.adjustCameraToBoard(this.game.getRows(), this.game.getCols());
                return;

            case GameStatus.Skins:
                this.goToSkinsView();

                return;
            case GameStatus.Profile:
                // this.adjustCamera();
                return;
        }
    }

    getMax(a: number, b: number): number {
        return a > b ? a : b;
    }


    initOrbitControls() {

        this.parentListener = new ElementListener();
        this.parentListener.clientWidth = this.stage.getCanvasWidth();
        this.parentListener.clientHeight = this.stage.getCanvasHeight();

        this.listener = new ElementListener(this.parentListener);
        this.listener.clientWidth = this.parentListener.clientWidth;
        this.listener.clientHeight = this.parentListener.clientHeight;

        // const camera = this.mappedCameras.get('Camera_Orientation');

        // const camera = new PerspectiveCamera(1000, 1, 1, 100);

        const camera = this.stage.camera.clone();


        this.stage.scene.add(camera);

        this.controls = new OffscreenOrbitControls(camera, this.listener as any, { focus: () => { } });

        camera.position.copy(this.cameraContainer.position);
        this.controls.enabled = false;


    }


    dispatchControlsParentEvent(event: EventProps) {
        event.preventDefault = event.stopPropagation = () => { };
        this.parentListener.dispatchEvent(event as any);
    }

    dispatchControlsEvent(event: EventProps) {
        event.preventDefault = event.stopPropagation = () => { };
        this.listener.dispatchEvent(event as any);
        // this.adjustNextBlockCamera();
    }

    // adjustNextBlockCamera() {
    //     const z = this.stage.cameras[0].position.z * 0.15;
    //     this.nextBlockStage.camera.position.set(-2, -1, z);
    // }


    setStatsVisible(isTrue: boolean): void {
        throw new Error('Method not implemented.');
    }


    getStatus(): GameStatus {
        return this.engine.getStatus();
    }


    play(): void {
        if (!this.isPaused) return;

        this.isPaused = false;
        // this.stage.setBlur(false);
        // this.nextBlockStage.setBlur(false);
        this.animate();
        this.engine.play();
        // this.engine.onGameOver().then(() => this.setStatus(GameStatus.GameOver));
    }


    pause(): void {
        if (this.isPaused) return;
        // this.stage.setBlur(true);
        // this.nextBlockStage.setBlur(true);
        this.engine.pause();
        this.isPaused = true;
    }


    async exitGame(): Promise<void> {
        this.engine.gameOver();

        this.controls.autoRotate = false;
        this.controls.enabled = false;
        this.cameraAdjuster.initializeCameraPositionAnimation();
        this.goToIntroView();

        this.onExitSubject.next();
    }


    async onExitGame(): Promise<void> {
        return new Promise(resolve => {
            this.onExitSubject.pipe(skip(1)).subscribe(() => resolve());
        });
    }


    async onGameOver(): Promise<void> {
        return this.engine.onGameOver().then(async () => {

            await this.cameraAdjuster.initializeCameraPositionAnimation();

            if (this.getStatus() !== GameStatus.GameOver) return;


            this.controls.autoRotate = true;
            this.controls.enabled = true;
        });
    }

    initGridHelper() {
        const max = this.game.getRows() > this.game.getCols() ? this.game.getRows() : this.game.getCols();
        const color = new Color('#bbbdbf');
        this.gridHelper = new GridHelper(max, max, color, color);
        this.gridHelper.position.set(0, (2 * this.game.getRows() - max) / 2, 0)
        this.gridHelper.rotateX(Math.PI / 2);
        this.stage.add(this.gridHelper);
    }


    private getObject(name: string): Object3D {
        return this.stage.scene.getObjectByName(name);
    }


    async goToIntroView(): Promise<void> {
        const promise = this.goToView({ fromPage: this.page, toPage: Pages.Play });
        this.addIntroBlocks();
        this.setStatus(GameStatus.Intro);
        this.page = Pages.Play;
        return promise;
    }


    async goToProfileView(): Promise<void> {
        // this.adjustProfileCamera();  
        const promise = this.goToView({ fromPage: this.page, toPage: Pages.Profile });
        this.setStatus(GameStatus.Profile);
        this.page = Pages.Profile;
        return promise;
    }

    async goToSkinsView(): Promise<void> {
        const promise = this.goToView({ fromPage: this.page, toPage: Pages.Skins });
        this.setStatus(GameStatus.Skins);
        this.page = Pages.Skins;
        return promise;
    }

    async getSkinArrowsPosition(index: number): Promise<ScreenPosition> {
        const block = this.skinsContainer.children[index];
        return this.engine.toScreenPosition(block);
    }

    async goToReplaysView(): Promise<void> {
        return this.goToIntroView();
    }

    async goToView(params: PageTransitionParams): Promise<void> {

        let keyframes: {
            focusKeyframe: Keyframe;
            cameraKeyframe: Keyframe;
        };

        const isWide = this.stage.camera.aspect > 1.2 ? true : false;

        switch (params.toPage) {
            case Pages.Play:
                keyframes = this.animations.getKeyframes(Keyframes.Board);
                break;
            case Pages.Profile:
                const name1 = isWide ? Keyframes.ProfileWide : Keyframes.ProfileNarrow;
                keyframes = this.animations.getKeyframes(name1);
                this.cameraAdjuster.adjustCamera(keyframes);
                break;
            case Pages.Skins:
                const name2 = isWide ? Keyframes.SkinsWide : Keyframes.SkinsNarrow;
                keyframes = this.animations.getKeyframes(name2);
                this.cameraAdjuster.adjustCamera(keyframes);
        }


        this.engine.setBoardWallsVisible(false);
        this.addIntroBlocks();
        this.play();

        const duration = 1000;

        await Promise.all([
            Tweens.transitVec3(this.focusBox.scale, keyframes.focusKeyframe.scale, duration),
            Tweens.transitVec3(this.focusBox.position, keyframes.focusKeyframe.position, duration),
            Tweens.transitQuat(this.focusBox.quaternion, keyframes.focusKeyframe.quaternion, duration),
            Tweens.transitVec3(this.cameraContainer.scale, keyframes.cameraKeyframe.scale, duration),
            Tweens.transitVec3(this.cameraContainer.position, keyframes.cameraKeyframe.position, duration),
            Tweens.transitQuat(this.cameraContainer.quaternion, keyframes.cameraKeyframe.quaternion, duration),
        ]);

    }


    setAntialias(isTrue: boolean): void {
        this.stage.setAntialias(isTrue);
        this.nextBlockStage.setAntialias(isTrue);
    }


    setCastShadows(isTrue: boolean): void {
        this._setCastShadows(isTrue);

        this.engine.setCastShadowToObjects(isTrue);


    }

    private _setCastShadows(isTrue: boolean): void {
        this.engine.setCastShadows(isTrue);
        this.engine.setReceiveShadows(isTrue);
        this.stage.renderer.shadowMap.enabled = isTrue;

        this.stage.setShadowMapEnable(isTrue);

        if (isTrue) {
            this.stage.setShadowMapType(PCFShadowMap);
        }

        this.spot.castShadow = isTrue;

        this.getObject('skins_spot_light_Orientation').castShadow = isTrue;
    }


    setReceiveShadows(isTrue: boolean): void {
        throw new Error('Its not implemented')
    }


    hasAntialias(): boolean {
        return this.videoConfig.hasAntialias;
    }


    hasFog(): boolean {
        return this.stage.hasFog();
    }


    setFog(isTrue: boolean): void {
        this.stage.setFog(isTrue);
    }


    private setStatus(status: GameStatus) {
        this.engine.setStatus(status);

    }


    private addIntroBlocks(): void {
        if (!this.isAddIntroBlocks) {
            this.engine.addIntroBlocks();
            this.isAddIntroBlocks = true;
        }
    }


    private initStage(canvas: HTMLCanvasElement | OffscreenCanvas): void {

        const gltf = this.geometries.getTerrain();

        const rendererParams: WebGLRendererParameters = {
            canvas: canvas,
            antialias: this.videoConfig.hasAntialias
        };

        const cameras = <Array<PerspectiveCamera>>gltf.cameras;

        this.mappedCameras = new Map();

        for (const camera of cameras) {
            this.mappedCameras.set(camera.name, camera);
        }

        this.stage = new SimpleStage(rendererParams, this.mappedCameras);
        this.stage.scene.add(...gltf.scene.children);


        this.stage.scene.background = new Color(0xdddddd);


        this.addStageLights();

        const box = this.getObject('skins_container');
        this.skinsContainer = new Group();
        this.skinsContainer.position.copy(box.position);
        this.skinsContainer.quaternion.copy(box.quaternion);
        this.stage.remove(box)
        this.stage.add(this.skinsContainer);

        this.initAnimations(gltf.animations);


        this.initOrbitControls();

        this.cameraAdjuster = new CameraAdjuster(
            this.controls,
            this.cameraContainer,
            this.focusBox,
            this.animations
        );


        // this.playSpotAnimation();

    }


    private initAnimations(clips: AnimationClip[]) {

        this.cameraContainer = this.getObject(PageTransitionRoots.CameraContainer);
        this.cameraContainer.visible = false;

        this.focusBox = this.getObject(PageTransitionRoots.FocusBox);
        this.focusBox.visible = false;


        this.stage.camera.lookAt(this.focusBox.position);

        const objects = [this.cameraContainer, this.focusBox, this.spot];

        this.animations = new Animations(clips, objects);

    }


    private addStageLights(): void {

        this.stage.add(new AmbientLight(0xcccccc, 0.3));

        const sun = this.getObject('Sun_Orientation') as DirectionalLight;
        sun.color = new Color(0x404040);

        const skins_spot1 = this.getObject('skins_spot_light_Orientation') as SpotLight;
        skins_spot1.lookAt(this.getObject('skins_container').position);
        skins_spot1.intensity = 0.2;
        skins_spot1.shadow.mapSize.width = 1024;
        skins_spot1.shadow.mapSize.height = 1024;

        const skins_spot2 = this.getObject('skins_spot_light2_Orientation') as SpotLight;
        skins_spot2.lookAt(this.getObject('skins_container').position);

        this.spot = this.getObject('Spot_Orientation') as SpotLight;
        this.spot.intensity = 0.35;
        this.spot.shadow.mapSize.width = 1024;
        this.spot.shadow.mapSize.height = 1024;
        this.spot.lookAt(this.getObject('center_rock_rigit').position);

        // this.spotTarget = new Vector3(0, this.game.getRows() / 2, 0);
        // this.spotTarget = this.getObject('center_rock_rigit').position;


    };

    private getPlayer(): IPlayerInfo {
        return this.game.getPlayer(this.playerIndex);
    }

    addPoints(player: IPlayerInfo, points: HitPoints, isMatrixClear: boolean) {

        if (!points) return;

        this.pushPoints(
            player.username,
            {
                x: points.x - 50,
                y: points.y,
                value: player.level * 4,
                color: this.engine.HitPointsColors[0],
                opacity: 1,
                time: points.time
            });


        if (points.value === 0) return;


        points.value *= player.level;
        this.pushPoints(player.username, points);


        if (!isMatrixClear) return;

        this.pushPoints(
            player.username,
            {
                x: points.x - 100,
                y: points.y,
                value: player.level * 100,
                isMatrixClear: true,
                color: this.engine.HitPointsColors[5],
                opacity: 1,
                time: points.time
            }
        );
    }


    private async next() {
        if (this.getStatus() !== GameStatus.Game) return;

        const player = this.game.getPlayer(this.playerIndex);

        await Tweens.timeout(200);
        const tween = this.engine.isPlayerTweening(this.playerIndex);
        if (tween) {
            tween.onComplete(async () => {
                await Tweens.timeout(200);
                this.next();
            });
            return;
        };

        this.game.nextMove();

        this.engine.updateNextBlock();

        const score = this.engine.next(this.playerIndex);

        if (!score) {
            const command = new GameOver();

            this.pushCommand(player.username, command, true);
            // this.controls.enabled = true;
            this.setStatus(GameStatus.GameOver);


            this.engine.addIntroBlocks();
        }


        this.engine.addBlock(this.playerIndex, this.game.getCurrIndex());
        const tweens = this.engine.fall(this.playerIndex);

        if (tweens) {
            tweens.fallTween.onComplete(() => this.next());

            const command = new NextBlock({
                index: this.game.getCurrIndex(),
                startPos: tweens.fallTween._valuesStart,
                endPos: tweens.fallTween._valuesEnd,
                duration: tweens.fallTween.duration
            });

            // if (this.getStatus() !== GameStatus.Replays) { 
            this.pushCommand(player.username, command, true);
            // }

        }

        if (!score) return;

        this.addPoints(player, score.hitPoints, score.isMatrixClear);

        if (score.rows.length === 0) return;

        this.pushCommand(player.username,
            new CompletedRows({
                rows: score.rows,
                positions: score.positions
            }),
            true
        );

    }



    // private initCameraPosition() {
    //   // this.controls.enabled = false;
    //   // this.stage.camera.rotation.set(0, 0, 0);
    //   this.stage.camera.position.z = 11.5 + 2;
    //   this.stage.camera.position.y = this.game.getRows() / 2;
    //   this.stage.camera.position.x = this.game.getCols() / 2; 
    // } 


    pushIndices(indices: number[]) {
        this.game.pushIndices(indices);
    }


    async initGame(data?: IGameData) {
        if (!this.game) {
            this.game = new Game(data);
        }

        await this.game.initGame(data);


        this.game.onIndicesRequest().subscribe(() => {
            this.pushCommand(this.game.getPlayer(0).username, new IndicesRequest(10), true);

        });


    }


    async replay(data: IGameReplayData, delay: number): Promise<void> {
        this.setGameConfig({
            rows: data.gameLoggerData.rows,
            cols: data.gameLoggerData.cols,
            mode: data.gameLoggerData.mode
        });





        await this.initGame(data.gameData);

        this.engine.initPlayers();

        this.cameraAdjuster.adjustCameraToBoard(this.game.getRows(), this.game.getCols());


        this.setStatus(GameStatus.Replays);

        this.engine.resetBoardWalls();


        const players = this.game.getPlayers();

        for (let i = 0; i < players.length; i++) {
            this.engine.addPlayerBoard(i);
        }

        let playerIndex = 0;

        for (const logs of data.gameLoggerData.logs) {

            const commands = logs[1].commands;
            this.engine.followCommand(playerIndex, commands[0]);
        }

        await Tweens.timeout(delay);

        this.canMove = true;

        playerIndex = 0;

        const promises = new Array();
        for (const logs of data.gameLoggerData.logs) {
            promises.push(this.engine.followCommands(playerIndex, logs[1].commands));
            playerIndex++;
        }

        await Promise.all(promises);

    }



    setGameConfig(config: GameConfig) {
        this.game.setRows(config.rows);
        this.game.setCols(config.cols);
        this.game.setMode(config.mode);
        this.engine.updatePlayersGameConfig();
    }


    async getGameConfig(): Promise<GameConfig> {
        return this.game.getConfig();
    }


    async restart(gameData: IGameData): Promise<void> {

        this.canMove = false;
        this.isAddIntroBlocks = false;

        this.controls.enabled = false;
        this.controls.autoRotate = false;

        await this.game.initGame(gameData);

        this.cameraAdjuster.adjustCameraToBoard(this.game.getRows(), this.game.getCols());


        this.engine.startGame();

        // if (data) return;

        const players = this.game.getPlayers();
        const sendPeer = (this.game.getMode() === GameMode.OneVsOne ? true : false);


        this.engine.addBlock(this.playerIndex, this.game.getCurrIndex());

        this.pushCommand(players[this.playerIndex].username, new AddBlock(this.game.getCurrIndex()), sendPeer);


        await Tweens.timeout(4000);

        this.canMove = true;

        const tween = this.engine.fall(this.playerIndex).fallTween.onComplete(() => this.next());

        const command = new MoveBlock({
            action: MoveBlockAction.Fall,
            startPos: tween._valuesStart.y,
            endPos: tween._valuesEnd.y,
            duration: undefined
        });

        this.pushCommand(this.getPlayer().username, command, sendPeer);
    }


    private initNextBlockStage(canvas: HTMLCanvasElement | OffscreenCanvas): void {
        const rendererParams: WebGLRendererParameters = {
            canvas: canvas,
            antialias: this.videoConfig.hasAntialias,
            alpha: true
        };

        this.nextBlockStage = new SimpleStage(rendererParams);
        this.nextBlockStage.renderer.setClearColor(0x000000, 0);
        // this.nextBlockStage.setSize(128, 128);
        // Ambient light
        const light1 = new AmbientLight(0xcccccc); // soft white light
        this.nextBlockStage.add(light1);
        // Directional Light
        let directionalLight = new DirectionalLight(0xffffff, 0.5);
        this.nextBlockStage.add(directionalLight);
        // Spot Light
        const spotLight = new SpotLight(0x404040, 2, 20, 100, 2);
        spotLight.position.set(this.game.getCols() / 2, this.game.getRows() * 2, 100);
        spotLight.lookAt(new Vector3(0, this.game.getRows() / 2, 0))
        this.nextBlockStage.add(spotLight);

        this.nextBlockStage.camera.zoom = 2;
        this.nextBlockStage.camera.updateProjectionMatrix();
        this.nextBlockStage.camera.position.set(-3, 0, 8);

    }

    private animate(): void {
        if (this.isPaused) return;

        Tweens.update();

        if (this.controls.enabled) {
            this.controls.update();
            this.cameraContainer.position.copy(this.controls.object.position);
        }

        //update animations 
        // this.animations.update(this.clock.getDelta());

        this.stage.camera.lookAt(this.focusBox.position);

        // this.spot.lookAt(this.spotTarget);


        this.nextBlockStage.render();

        this.engine.animate();

        this.stage.render();

        requestAnimationFrame(() => this.animate());
    }


    private async init(data: IScenarioData) {

        if (data) {
            for (const key of Object.keys(data)) {
                this[key] = data[key];
            }
        }

        this.geometries = GeometryLoader.getInstance();
        await this.geometries.load();

        // const players = this.game.getPlayers();
        // this.getPlayer() = players[0];

        this.initGame(data.gameData);

        this.initStage(data.stageCanvas);

        this.initNextBlockStage(data.nextBlockStageCanvas);


        this.skinsEditor = new SkinsEditor(
            this.skinsContainer,
            this.getPlayer().theme,
            data.gameData.blockTypes,
            data.useGameWorker
        );


        // for (let i = 0; i < this.game.getPlayers().length; i++) {
        //     const board = this.engine.getBoard(i);
        //     this.stage.add(board);
        // }


        this.engine = new Engine(
            this.stage,
            this.nextBlockStage,
            this.game,

            this.useCannonWorker
        );



        this.setFog(this.videoConfig.hasFog);
        this._setCastShadows(this.videoConfig.castShadows);
        // this.setReceiveShadows(this.videoConfig.castShadows);

        await this.engine.init();

        this.engine.setBoardWallsVisible(false);

        //*  for debug only
        if (!this.useCannonWorker && this.debugRenderer) {
            this.stage.setDebugRenderer(this.engine.getWorldInstance());
        }



        //*/ 

        // switch (this.getStatus()) {
        //     case GameStatus.Profile:
        //         this.page = Pages.Profile;
        //         break;
        //     case GameStatus.Skins:
        //         this.page = Pages.Skins;
        //         break;
        //     default:
        //         this.page = Pages.Play;

        // }

    }




    private playSpotAnimation() {
        // const action = this.animations.spotAction();
        // action.setDuration(2000);
        // action.play();
    }


    private cameraAdjuster: CameraAdjuster;

    private clock = new Clock();

    private spot: PointLight;
    private spotTarget: Vector3;

    private focusBox: Object3D;
    private cameraContainer: Object3D;

    private page: Pages.Play | Pages.Profile | Pages.Skins = Pages.Play;

    private mappedCameras: Map<string, PerspectiveCamera>;
    private animations: Animations;


    private parentListener: ElementLike;
    private listener: ElementLike;
    private controls: OffscreenOrbitControls;


    private skinsEditor: SkinEditable;

    private engine: Engine;

    private isPaused: boolean = true;
    private stage: SimpleStage;
    private nextBlockStage: SimpleStage;

    private gridHelper: GridHelper;

    private skinsContainer: Group;
    private isAddIntroBlocks: boolean = false;
    private canMove: boolean = true;

    private game: Game;
    private geometries: GeometryLoader;

    private debugRenderer?: boolean;
    private useCannonWorker?: boolean = false;
    // private gameData?: IGameData;
    private videoConfig: VideoConfig;

    private isReady: boolean = false;
    private ready: Promise<void>;

    private readonly playerIndex = 0;


    private lastUserCommands: GameCommand;

    private onExitSubject: BehaviorSubject<void> = new BehaviorSubject(null);

}
