import { Vector3, Group, Vector2, Mesh, Vector4, Object3D } from 'three';
import { World as CannonWorld } from 'cannon-es';
import { MoveBlock, GameCommands, GameCommand, MoveBlockAction, AddBlock } from 'src/app/logger/commands';
import { HitPoints } from 'src/app/components/sprites/sprite';
import { Tweens } from './tweens';
import { SimpleStage } from './simple-stage';
import { Player } from './player';
import { GameStatus, GameMode, GameConfig } from './game.interface';
import { CylinderInstructions, IWorld } from './physics/world.interface';
import { World } from './physics/world';
import { Brick } from './shapes/brick';
import { IBrickShadowParams, IReleaseBlockParams, Pool, PoolOutOfObjectsError } from './pool';
import { IGame } from './game';
import { BoardWalls, Walls } from './walls';
import { WorldSwitcher } from './physics/world-switcher';
import { Block } from './shapes/block';
import { BehaviorSubject } from 'rxjs';
import { skip } from 'rxjs/operators';
import { Matrix } from './matrix';

export class Engine {

  HitPointsColors = ["#f0ddc5", "#f0c846", "#f5b478", "f0965a", "#f95a30", "#dd2727"];

  constructor(
    private stage: SimpleStage,
    private nextBlockStage: SimpleStage,
    private game: IGame,
    private useWorker: boolean
  ) { }


  isUsingWorker(): boolean {
    return this.useWorker;
  }

  // only for debug
  getWorldInstance(): CannonWorld {
    return (this.world as World).getWorldInstance();
  }


  async init(): Promise<void> {

    this.world = await WorldSwitcher.getInstance().init({
      useWorker: this.useWorker,
      rows: this.game.getRows(),
      cols: this.game.getCols()
    });


    this.pool = new Pool();

    this.initPlayers();

    // const camera = this.stage.camera;
    // this.stage.scene.attach(camera);

    // const offsetX = this.game.getCols() / 2;
    // camera.position.setZ(32 + this.game.getRows() * 1.4);
    // camera.position.setX(camera.position.x + offsetX);

    this.initBoardWalls(this.game.getConfig());


    const skinsRock = this.stage.scene.getObjectByName('skins_rock');
    skinsRock.receiveShadow = true;

    const centerRock = this.stage.scene.getObjectByName('center_rock');
    centerRock.receiveShadow = true;
    for (const mesh of centerRock.children) {
      mesh.receiveShadow = true;
    }


    const rockRigit = this.stage.scene.getObjectByName('center_rock_rigit') as Mesh;
    rockRigit.visible = false;
    // rockRigit.position.setX(rockRigit.position.x + offsetX);

    const instructions: CylinderInstructions = {
      radiusTop: rockRigit.scale.x,
      radiusBottom: rockRigit.scale.z,
      height: rockRigit.scale.y * 2,
      mass: 0,
      numSegments: 16,
      position: rockRigit.position,
      quaternion: rockRigit.quaternion as any
    }

    this.world.addCylinder(instructions);

    const vector3 = this.getVector3().set(0, -20, 0);
    this.world.setGravity(vector3);
    this.pool.aquireVector3(vector3);

    this.addPoolObjectsToBoard();


  }


  updatePlayersGameConfig() {
    for (const player of this.players) {
      player.updateGameConfig(this.game.getRows(), this.game.getCols());
    }
  }


  async followCommands(playerIndex: number, commands: GameCommand[]): Promise<void> {
    return new Promise(async resolve => {

      if (commands.length <= 1) return;

      this.followCommand(playerIndex, commands[0]);
      commands[0].time = commands[1].time;

      for (let i = 1; i < commands.length; i++) {
        await Tweens.timeout(commands[i].time - commands[i - 1].time);
        this.followCommand(playerIndex, commands[i]);
      }

      resolve();
    });
  }


  followCommand(playerIndex: number, command: GameCommand): void | MoveCompleted {

    switch (command.type) {
      case GameCommands.MoveBlock:
        switch ((command as MoveBlock).action) {
          case MoveBlockAction.TurnRight:
            this.turn(playerIndex, 1);
            return;
          case MoveBlockAction.TurnLeft:
            this.turn(playerIndex, -1);
            return;
          case MoveBlockAction.MoveRight:
            this.move(playerIndex, 1);
            return;
          case MoveBlockAction.MoveLeft:
            this.move(playerIndex, -1);
            return;
          case MoveBlockAction.Fall:
            this.fall(playerIndex, { time: (command as MoveBlock).duration });
            return;
        }

      case GameCommands.AddBlock:
        return this.addBlock(playerIndex, (command as AddBlock).index);
      case GameCommands.GameOver:
        this.gameOver();
        this.setStatus(GameStatus.GameOver);
        return;
      case GameCommands.NextBlock:
        const result = this.next(playerIndex);
        this.addBlock(playerIndex, (command as AddBlock).index);
        this.fall(playerIndex);
        return result;
    }

  }

  private castShadows: boolean = false;
  private receiveShadows: boolean = false;


  setCastShadows(isTrue: boolean): void {
    this.castShadows = isTrue;
  }


  setCastShadowToObjects(isTrue: boolean): void {

    this.boardWalls.setCastShadow(isTrue);

    for (const player of this.players) {

      for (const brick of player.board.children) {
        for (const mesh of brick.children) {
          mesh.castShadow = isTrue;
        }
      }
    }
  }


  setReceiveShadows(isTrue: boolean): void {
    this.receiveShadows = isTrue;
  }


  isPlayerTweening(playerIndex: number): false | any {
    return this.players[playerIndex].isTweening();
  }


  animate(): void {

    if (this.isPaused) return;

    this.world.update(); // update physics

    for (const player of this.players) {

      if (player.physicalBricks.length > 0) {
        this.dropBricks(player);
      }

      if (this.status === GameStatus.Game || this.status === GameStatus.GameOver) {
        if (player.cblock) {
          player.cblock.rotateX(Math.PI * 0.0015);
          player.cblock.rotateY(Math.PI * 0.002);
          player.cblock.rotateZ(Math.PI * 0.005);
        }
      }
    }

  }


  play(): void {
    this.isPaused = false;
    for (const player of this.players) {
      if (player.tween) {
        player.tween.resume();
      }
    }
  }


  pause(): void {
    this.isPaused = true;
    for (const player of this.players) {
      if (player.tween) {
        player.tween.pause();
      }
    }
  }


  startGame() {

    this.setStatus(GameStatus.Game);

    this.initPlayers();

    this.updateNextBlock();

    this.resetBoardWalls();

    this.nextBlockStage.add(this.players[0].cblocks);

  }


  resetBoardWalls() {
    this.initBoardWalls(this.game.getConfig());
    this.boardWalls.setVisible(true);
    this.boardWalls.animate();
  }


  addPlayerBoard(playerIndex: number): void {
    const board = this.players[playerIndex].board;
    if (!this.stage.scene.children.includes(board)) {
      this.stage.add(board);
    }
  }


  setBoardWallsVisible(isTrue: boolean): void {
    this.boardWalls.setVisible(isTrue);
  }


  setStatus(status: GameStatus) {
    this.status = status;
    this.world.setStatus(this.status);
  }


  getStatus(): GameStatus {
    return this.status;
  }


  next(playerIndex: number): void | MoveCompleted {

    if (this.status === GameStatus.GameOver) return;

    const player = this.players[playerIndex];

    const positions = this.storeBricks(player);

    if (!positions) return this.gameOver();

    const completedRows = player.checkRows(positions);
    const rows = completedRows.slice(0); // clone array

    this.dropRows(player, completedRows, positions);

    // if (!(player === this.players[0])) return;

    const score = this.getScore(player, rows.length);
    const screenPosition = this.toScreenPosition(player.block);

    return {
      rows: rows,
      positions: positions,
      isMatrixClear: score.isMatrixClear,
      hitPoints: {
        x: screenPosition.x,
        y: screenPosition.y,
        value: score.points,
        color: score.color,
        opacity: 1,
        time: Date.now()
      }

    };
  }


  fall(playerIndex: number, params?: { time: number, move?: number, rotate?: number }): { resumeTween?: any, fallTween?: any } {

    const player = this.players[playerIndex];

    if (player.tween) {
      player.tween.pause();
    }

    Tweens.update();


    const pos = player.fallRaycast({ rotate: params?.rotate, move: params?.move });

    const y = player.block.position.y - pos.y;

    if (y <= 0) {
      // if(player.tween)
      if (player.tween) {
        player.tween.resume();
      }
      return;
      // return;
    }

    let time: number;
    if (params?.time) {
      time = (params.time * y) / this.game.getRows();
    } else {
      time = (this.game.getFallTime() * y) / this.game.getRows();
    }

    player.pblock.position.copy(pos);
    player.tween = Tweens.fall(player.block.position, pos.y, time);
    return { fallTween: player.tween };
  }


  turn(playerIndex: number, direction: number): { resumeTween?: any, rotateTween?: any, fallTween?: any } {

    const player = this.players[playerIndex];

    if (player.tween) player.tween.pause();

    Tweens.update();

    if (!player.isValidRotate(direction)) {
      return { resumeTween: player.tween.resume() };
    }

    Tweens.rotate(player.pblock.rotation, direction, 100);


    const tweens = this.fall(
      playerIndex, {
      time: this.game.getFallTime(),
      rotate: direction
    });

    if (!tweens) return;

    return {
      rotateTween: Tweens.rotate(player.block.rotation, direction, 100),
      fallTween: tweens.fallTween,
    }
  }


  move(playerIndex: number, direction: number): { resumeTween?: any, moveTween?: any, fallTween?: any } {

    const player = this.players[playerIndex];

    if (player.tween) player.tween.pause();

    Tweens.update();

    if (!player.isValidMove(direction)) {
      return { resumeTween: player.tween.resume() };
    }

    Tweens.move(player.pblock.position, direction, 100);

    const tweens = this.fall(
      playerIndex, {
      time: this.game.getFallTime(),
      move: direction
    });


    if (!tweens) return;

    return {
      moveTween: Tweens.move(player.block.position, direction, 100),
      fallTween: tweens.fallTween,
    };
  }


  storeBricks(player: Player): false | Vector2[] {

    // player.block.updateMatrixWorld();
    const positions: Vector2[] = new Array();
    const vector3 = this.getVector3();

    // in case there are no bricks in the pool left
    if (this.pool.getBrickUnlockedSize(player.block.bricks[0].getPoolKey()) < 4) {
      this.pool.duplicateBricksToPool(player.block.bricks[0], 4);
    }

    // const bricksToAdd = new Array();
    for (const b of player.block.bricks) {
      vector3.setFromMatrixPosition(b.matrixWorld);
      vector3.sub(player.board.position);

      const brick = this.pool.releaseBrick(b.getPoolKey());
      brick.position.copy(vector3);
      // brick.updateMatrix()
      const x = this.game.getRows() - 1 - Math.floor(brick.position.y);
      const y = Math.floor(brick.position.x);

      try {
        player.matrix[x][y] = brick;
        player.bricksInMatrix++;
        positions.push(new Vector2(x, y));

      } catch (error) {
        this.pool.reacquireBrick(brick);
        return false;
      }
    }

    this.pool.aquireVector3(vector3);
    return positions;
  }


  gameOver(): void {
    if (this.status === GameStatus.GameOver) return;

    const vec3 = this.getVector3();

    for (const player of this.players) {

      for (const brick of player.matrix.getAvailableObjects()) {
        brick.position.add(player.board.position);
        this.world.addBrick(brick);
        player.physicalBricks.push(brick);
      }
      player.bricksInMatrix = 0;
      player.matrix.reset();

      if (!player.block) continue;

      for (const b of player.block.bricks) {
        vec3.setFromMatrixPosition(b.matrixWorld);
        // vec3.sub(player.board.position);

        const brick = this.pool.releaseBrick(b.getPoolKey());
        brick.position.copy(vec3);

        this.world.addBrick(brick);
        player.physicalBricks.push(brick);
      }


      this.pool.reacquireBlock(player.block);
      this.pool.reacquireBlock(player.pblock);
      this.pool.reacquireBlock(player.vblock);
      if (player.cblock) {
        this.pool.reacquireBlock(player.cblock);
      }

    }

    this.pool.aquireVector3(vec3);

    this.onGameOverSubject.next();

  }


  async onGameOver(): Promise<void> {
    return new Promise(resolve => {
      this.onGameOverSubject.pipe(skip(1)).subscribe(() => resolve());
    });
  }


  explodeBricks(player: Player): void {
    const zero = this.getVector3();
    const vec3 = this.getVector3();

    for (const b of player.physicalBricks) {
      const diff = vec3.subVectors(b.position, zero)
      const val = Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2) + Math.pow(diff.z, 2));

      if (val < 6) {
        this.world.explodeBrick(b);
        break;
      }
    }
    this.pool.aquireVector3(zero);
    this.pool.aquireVector3(vec3);
  }


  addIntroBlocks(): void {
    if (this.status === GameStatus.Game || this.status === GameStatus.Replays) {
      return;
    }

    this.addIntroBlock(-(Math.random() * 30));

    const duration = this.players[0].physicalBricks.length * 3000;

    Tweens.timeout(Math.random() * duration).then(() => this.addIntroBlocks());
  }


  getVector4() {
    throw new Error("Method not implemented.");
  }


  addBlock(playerIndex: number, blockIndex: number): void {

    if (this.status === GameStatus.GameOver) return;
    const player = this.players[playerIndex];

    try {
      if (player.block) {
        this.pool.reacquireBlock(player.block);
        this.pool.reacquireBlock(player.pblock);
        this.pool.reacquireBlock(player.vblock);
      }
    } catch (error) {
      return console.error(error);
    }

    player.block = this.pool.releaseBlock(player.getBlockKey(blockIndex));
    player.pblock = this.pool.releaseBlock(player.getPBlockKey(blockIndex));
    player.vblock = this.pool.releaseBlock(player.getVBlockKey(blockIndex));

    let offsetx = player.block.blockType.pivot.x == 0.5 ? 0 : -0.5;
    offsetx += this.game.getCols() % 2 != 0 ? 0.5 : 0;
    const offsety = player.block.blockType.pivot.y == 0.5 ? 0.5 : 0;

    player.block.position.set(
      this.game.getCols() / 2 + offsetx,
      this.game.getRows() + 2 + offsety,
      player.board.position.z
    );

    player.pblock.position.copy(player.block.position);

  }


  premakeMatrix(player: Player, animate: boolean) {
    console.log("premakeMatrix")
    player.matrix.reset();

    for (let row = 0; row < this.game.getRows(); row++) {
      for (let col = 0; col < this.game.getCols(); col++) {

        if (row > 1 && (col < 5 || col > 9)) {
          const i = Math.floor((Math.random() * 7));
          const brick = this.pool.releaseBrick(player.getBrickKey(i));

          if (animate) {
            brick.visible = false;
          }
          const y = this.game.getRows() - row;
          brick.position.set(col + 0.5, y - 0.5, player.board.position.z + 0.5);

          player.matrix[row][col] = brick;
        } else {
          player.matrix[row][col] = null;
        }
      }
    }

    if (animate) {
      Tweens.timeout(200).then(() => {
        this.animatePremakeMatrix(player.physicalBricks);
      });
    }
  }


  updateNextBlock() {
    for (const player of this.players) {

      if (player.cblock) {
        this.pool.reacquireBlock(player.cblock);
      }

      const cblockKey = player.getCBlockKey(this.game.getNextIndex());
      player.cblock = this.pool.releaseBlock(cblockKey);
    }

  }


  private getGroup(): Group {
    let group: Group;
    try {
      group = this.pool.releaseGroup();
    } catch (PoolOutOfObjectsError) {
      this.pool.aquireGroup();
      group = this.pool.releaseGroup();
    } finally {
      group.visible = true;
      return group;
    }
  }


  private getVector3(values?: { x: number, y: number, z: number }): Vector3 {
    let vector3: Vector3;
    try {
      vector3 = this.pool.releaseVector3();
      return vector3;
    } catch (PoolOutOfObjectsError) {
      this.pool.aquireVector3();
      vector3 = this.pool.releaseVector3();
    } finally {
      if (values) {
        vector3.set(values.x, values.y, values.z);
      }
      return vector3;
    }
  }


  private initBoardWalls(gameConf: GameConfig): void {

    if (this.boardWalls) {
      this.boardWalls.init(gameConf);
      this.world.setBoard(this.boardWalls.getInstructions());
      return;
    }

    const object: Walls = {
      bottom: this.stage.scene.getObjectByName('board1'),
      left: this.stage.scene.getObjectByName('board2'),
      right: this.stage.scene.getObjectByName('board3'),
    };
    this.boardWalls = new BoardWalls(object, gameConf);
    this.boardWalls.setCastShadow(this.castShadows);
    this.boardWalls.setReceiveShadow(this.receiveShadows);
    this.world.setBoard(this.boardWalls.getInstructions());


  }


  private factors(rows: number, cols: number): number[][] {

    const half = cols / 2 + (cols % 2 === 0 ? 0 : .5);
    const offset = cols % 2 === 0 ? 0 : 1;

    return new Array(rows).fill(0)
      .map((v, y) => new Array(half).fill(0)
        .map((v, x) => half - x)
        .concat(
          new Array(cols - half).fill(0)
            .map((v, x) => x + offset + 1)
        )
      );

  }

  private calculateBrickForce(matrix: Matrix): number {
    // const { x, y } = position;


    const factors = matrix
      .map((row: Brick[], y: number) => row
        .map((brick: Brick, x: number) => {

          const res = {
            x: 0,
            y: 0,
          }

          if (x === row.length / 2) {
            return 1;
          }

          if (x < row.length / 2) {
            return
            // if (y < matrix.length)
          }

          return res;
        })
      );

    return 0;
  }


  private dropBricks(player: Player): void {
    switch (this.status) {
      case GameStatus.Game:
      case GameStatus.Replays:

        const vector3 = this.getVector3();
        for (const brick of player.physicalBricks) {
          if (brick.position.y < -this.game.getRows() / 2) {
            this.removeBrick(player, brick);
            continue;
          }

          const diff = Math.abs(brick.position.z - player.board.position.z);
          // console.log(diff)

          //     const force = this.calculateBrickForce(brick.position);



          if (diff < 3) {
            vector3.set(0, -3, player.dropDirection * 18);
            this.world.setVelocity(brick, vector3);
          }
        }
        this.pool.aquireVector3(vector3);
        return;

      default:

        for (const brick of player.physicalBricks) {
          if (brick.position.y < -30) {
            this.removeBrick(player, brick);
          }
        }
    }
  }


  private removeBrick(player: Player, brick: Brick): void {
    this.pool.reacquireBrick(brick);
    this.world.removeBrick(brick);

    const index = player.physicalBricks.indexOf(brick);
    if (index >= 0) {
      player.physicalBricks.splice(index, 1);
    }
  }


  private addPhysicBlock(params: PhysicBlockParams): void {
    try {
      const block = this.pool.releaseBlock(params.player.getBlockKey(params.index));
      if (params.position) {
        block.position.copy(params.position)
        block.updateMatrixWorld();
      }
      const position = this.getVector3();

      for (const b of block.bricks) {

        // if (this.pool.getBrickUnlockedSize(b.getPoolKey()) <= 4) { 

        if (this.players[0].physicalBricks.length > 4 * 30) {

          this.addIntroBlock(-(Math.random() * 30));
          this.pool.reacquireBlock(block);

          if (this.activeExplosions < 5) {
            this.explodeBricks(params.player);
            this.activeExplosions++;

            const rand = Math.random() * 800 + 200;
            Tweens.timeout(rand).then(() => { this.activeExplosions--; });
          }
          throw new PoolOutOfObjectsError();
        }

        const brick = this.pool.releaseBrick(b.getPoolKey());
        // position.copy(b.position)
        position.setFromMatrixPosition(b.matrixWorld);
        // console.log(params.player.board.position.x)
        // position.setX(position.x -params.player.board.position.x)

        // position.add(params.player.board.position);
        brick.position.copy(position);
        // brick.position.setX(brick.position.x + this.game.getCols() / 2);

        if (params.quaternion) {
          this.world.setQuaternion(brick.bufferIndex, params.quaternion as any);
        }
        params.player.physicalBricks.push(brick);
        this.world.addBrick(brick);

        if (params.velocity) {
          this.world.setVelocity(brick, params.velocity);
        }
      }

      this.pool.aquireVector3(position);
      this.pool.reacquireBlock(block);
    } catch (error) { }
  }


  public addIntroBlock(yforce: number, initialHeight?: number): void {

    const position = this.getVector3({
      x: (this.game.getCols() - 2) * (Math.random() + 1 / 2) - this.game.getCols() / 2 + 2,
      y: initialHeight || this.game.getRows() * 2,
      z: this.players[0].board.position.z
    });

    const velocity = this.getVector3({ x: 0, y: yforce, z: 0 });
    this.addPhysicBlock({
      player: this.players[0],
      index: Math.floor((Math.random() * 7)),
      position,
      velocity
    });

    this.pool.aquireVector3(position);
    this.pool.aquireVector3(velocity);

  }


  private dropRows(player: Player, rows: Array<number>, positions: any[]): void {
    if (rows.length <= 0) return;

    let step = 0;
    let tempx: number;
    const position = this.getVector3();

    for (let x = rows[0]; x >= 0; x--) {
      if (rows[0] == x) {
        rows.splice(0, 1);

        const ypositions = new Array();
        for (const pos of positions) {
          if (pos.x == x) {
            ypositions.push(pos.y);
          }
        }
        ypositions.sort((a, b) => a - b);

        // add physical static invisible ground plane to help the explosion effect. 
        if (x < this.game.getRows() - 1 && (!tempx || tempx - x > 1)) {
          position.set(
            this.game.getCols() / 2,
            this.game.getRows() - x - 1.1,
            player.board.position.z + 0.5
          );
          this.world.setStaticDropRowPlane(position);
        }
        tempx = x;

        this.dropRow(player, x, ypositions);
        step++;
        continue;
      }

      const group = this.fallRow(player, x, step);
      if (group) {
        player.tweenGroups.push(group);
      }
    }

    this.pool.aquireVector3(position);
  }


  private dropRow(player: Player, x: number, yPositions: Array<number>) {
    for (let y = 0; y < this.game.getCols(); y++) {
      if (!player.matrix[x][y]) continue;
      const brick = player.matrix[x][y];
      brick.position.setX(brick.position.x - this.game.getCols() / 2);
      this.world.addBrick(brick);
      player.physicalBricks.push(player.matrix[x][y]);
      player.matrix[x][y] = null;
      player.bricksInMatrix--;
    }
  }


  private fallRow(player: Player, x: number, step: number): void | Group {
    let group: Group;
    for (let y = 0; y < this.game.getCols(); y++) {

      if (!(player.matrix[x][y] && player.matrix[x + step])) continue;

      if (!group) {
        group = this.getGroup();
        player.board.attach(group);
      }
      group.attach(player.matrix[x][y]);

      player.matrix[x + step][y] = player.matrix[x][y];
      player.matrix[x][y] = null;
    }

    if (!group) return;

    let y = group.position.y - step;
    let time = 1000;
    let delay = (this.game.getRows() - x) * 15;

    Tweens.fallWithBounce(group.position, y, time, delay)
      .onComplete(() => {

        this.world.resetStaticDropRowPlanes();

        for (let y = 0; y < this.game.getCols(); y++) {
          if (!player.matrix[x + step]) continue;

          const brick = player.matrix[x + step][y];
          if (!brick) continue;

          player.board.attach(brick);

          const yy = this.game.getRows() - 0.5 - x - step;
          const xx = y + 0.5;

          brick.position.set(xx, yy, player.board.position.z + 0.5);
          player.board.attach(brick);
        }

        player.board.attach(player.pblock);

        player.tweenGroups.splice(player.tweenGroups.indexOf(group), 1);
        this.stage.scene.attach(group);
        this.pool.aquireGroup(group);
      });

    if (group.children.length > 0) {
      return group;
    }

    player.board.attach(player.pblock);
    this.pool.aquireGroup(group);
  }


  toScreenPosition(obj: Object3D) {
    const v = this.getVector3();
    const widthHalf = this.stage.renderer.getContext().canvas.width / 2;
    const heightHalf = this.stage.renderer.getContext().canvas.height / 2;

    obj.updateMatrixWorld();
    v.setFromMatrixPosition(obj.matrixWorld);
    v.project(this.stage.camera);

    const coords = {
      x: - v.y * heightHalf + heightHalf,
      y: v.x * widthHalf + widthHalf
    };

    this.pool.aquireVector3(v);
    return coords;
  }


  private getScore(player: Player, numOfLines: number): { points: number, color: string, isMatrixClear: boolean } {
    return {
      points: 3 * numOfLines * (5 + numOfLines),
      color: this.HitPointsColors[numOfLines],
      isMatrixClear: player.bricksInMatrix == 0 ? true : false
    };
  }


  private animatePremakeMatrix(bricks: Brick[], i = bricks.length - 1) {
    Tweens.timeout(2).then(() => {
      if (i >= 0) {
        bricks[i].visible = true;
        this.animatePremakeMatrix(bricks, --i);
      }
    });
  }


  private releaseBlock(key: string, params?: IReleaseBlockParams): Block {
    if (params) return this.pool.releaseBlock(key, params);

    return this.pool.releaseBlock(key, {
      shadows: {
        castShadow: this.castShadows,
        receiveShadow: this.receiveShadows
      }
    });
  }


  private releaseBrick(key: string, shadows?: IBrickShadowParams): Brick {
    if (shadows) return this.pool.releaseBrick(key, shadows);

    return this.pool.releaseBrick(key, {
      castShadow: this.castShadows,
      receiveShadow: this.receiveShadows
    });
  }


  private reacquireBlock(block: Block): void {
    this.pool.reacquireBlock(block);
  }


  private reacquireBrick(brick: Brick): void {
    this.pool.reacquireBrick(brick);
  }


  private addPoolObjectsToBoard() {

    for (const player of this.players) {

      this.stage.add(player.board);

      for (const type of this.game.getBlockTypes()) {

        const cblockKey = player.getCBlockKey(type.index);
        const cblock = this.releaseBlock(cblockKey);
        player.cblocks.add(cblock);
        this.reacquireBlock(cblock);

        // add player's blocks to board
        const blockKey = player.getBlockKey(type.index);
        const block = this.releaseBlock(blockKey);
        player.board.add(block);
        this.reacquireBlock(block);

        // add player's projection blocks to board (pblocks)
        const pblockKey = player.getPBlockKey(type.index);
        const pblock = this.releaseBlock(pblockKey);
        player.board.add(pblock);
        this.reacquireBlock(pblock);

        // create validation blocks to board (vblocks)
        const vblockKey = player.getVBlockKey(type.index);
        const vblock = this.pool.releaseBlock(vblockKey);
        this.pool.reacquireBlock(vblock);

        // add the rest bricks to the player's board
        const brickKey = player.getBrickKey(type.index);
        const size = this.pool.getBrickUnlockedSize(brickKey);

        const bricks = new Array();
        for (let i = 0; i < size; i++) {
          const brick = this.releaseBrick(brickKey);
          // brick.castShadow = this.videoConfig.castShadows;
          // brick.receiveShadow = this.videoConfig.castShadows;
          player.board.add(brick);
          bricks.push(brick);
        }
        for (const brick of bricks) {
          this.reacquireBrick(brick);
        }
      }

    }

  }


  public initPlayers() {

    if (this.players) {
      for (const player of this.players) {

        for (const brick of player.physicalBricks) {
          this.world.removeBrick(brick);
        }
        this.stage.scene.remove(player.board);
      }
    }


    this.pool.clearObjectPools();

    this.players = new Array();

    if (this.game.getMode() === GameMode.Solo
      || !this.game.getPlayer(1)
    ) {

      this.players.push(
        // new CurrentPlayer(
        new Player(
          this.game.getPlayer(0).username,
          this.game.getPlayer(0).theme,
          this.game.getRows(),
          this.game.getCols(),
          this.getVector3()
        ));

    } else if (this.game.getMode() === GameMode.OneVsOne) {

      this.players.push(new Player(
        this.game.getPlayer(0).username,
        this.game.getPlayer(0).theme,
        this.game.getRows(),
        this.game.getCols(),
        this.getVector3({ x: 0, y: 0, z: 0.5 })
      ));

      this.players.push(new Player(
        this.game.getPlayer(1).username,
        this.game.getPlayer(1).theme,
        this.game.getRows(),
        this.game.getCols(),
        this.getVector3({ x: 0, y: 0, z: -1 })
      ));

    }


    const brickPoolSize = this.game.getCols() * this.game.getRows();
    const blockPoolSize = 1;

    for (const player of this.players) {
      this.pool.loadPlayerObjects(player, this.game.getBlockTypes(), brickPoolSize, blockPoolSize);
      player.matrix = new Matrix(this.game.getRows(), this.game.getCols());
      player.board.position.setX(-this.game.getCols() / 2);
    }

    this.addPoolObjectsToBoard();

  }


  private onGameOverSubject: BehaviorSubject<void> = new BehaviorSubject(null);

  private isPaused: boolean = false;
  private activeExplosions: number = 0;
  private status: GameStatus;
  private boardWalls: BoardWalls;
  private world: IWorld;
  private players: Player[];
  private pool: Pool;

}



export interface MoveCompleted {
  hitPoints: HitPoints;
  rows: Array<number>;
  positions: Array<Vector2>;
  isMatrixClear: boolean;
}

export class CompletedRows {
  rows: number[];
  vectors: Vector2[];

  constructor() {
    this.rows = [];
    this.vectors = [];
  }
}

interface PhysicBlockParams {
  player: Player,
  index: number,
  position?: Vector3,
  quaternion?: Vector4,
  velocity?: Vector3
}




  // private projectBrickPosition(player: Player): | void {
  //   let group, lastgroup: Group;

  //   let zero = this.getVector3();

  //   if (player.tweenGroups.length > 0) {

  //     // let group = player.tweenGroups[player.tweenGroups.length - 1];

  //      for (const i = player.tweenGroups.length - 1; i >= 0; i--) {
  //       group = player.tweenGroups[i];

  //       //       console.log(`- ${i}`)
  //        for (const brick of group.children) {
  //         const x = Math.floor(brick.getWorldPosition(zero).x);
  //         const y = Math.floor(brick.getWorldPosition(zero).y);
  //         //         console.log(`-- ${x} ${y}`)

  //          for (const b of player.block.bricks) {
  //           const xbrick = Math.floor(b.getWorldPosition(zero).x);
  //           const ybrick = Math.floor(b.getWorldPosition(zero).y);
  //           //            console.log(`--- ${xbrick} ${ybrick}`)

  //           if (x == xbrick && y == ybrick) {
  //             lastgroup = group;
  //           }
  //         }
  //       }

  //     }
  //   }
  //   this.pool.aquireVector3(zero);
  //   if (group) return group;
  // }


  //  addFallLightPath(player: Player, distance: number, time: number) {

  //   if (!this.isFallLightPathEnable) return;

  //   distance = player.block.position.y - distance;
  //   // TODO CHANGE BLOCK

  //   const positions = new Array();
  //   let vector3: Vector3;

  //    for (const brick of player.block.bricks) {
  //     vector3 = brick.getWorldPosition(this.getVector3());

  //     let doAdd = true;

  //      for (const p of positions) {
  //       if (vector3.x == p.x) {
  //         if (vector3.y >= p.y) {
  //           p.y = vector3.y;
  //         }
  //         doAdd = false;
  //         break;
  //       }
  //     }
  //     if (doAdd) {
  //       positions.push(vector3);
  //     }
  //   }



  //    for (const vector3 of positions) {
  //     vector3.sub(player.board.position);

  //     const material = player.pblock.getPrimaryMaterial();
  //     const mesh = new Mesh(new PlaneGeometry(1, 1), material);
  //     mesh.position.copy(vector3);
  //     player.board.add(mesh);

  //     Tweens.animateLightPath(mesh.scale, mesh.position, distance, time)
  //       .onComplete(() => {
  //         player.board.remove(mesh);
  //         this.pool.aquireVector3(vector3);
  //       });
  //     //   let group = new Group();
  //     //   group.add(new Mesh(new PlaneGeometry(1, 1), this.theme.user.materials[block.blockType.index+7]));
  //     //   group.add(new Mesh(new CircleGeometry(0.5, 32),this.theme.lightPathMaterial ));
  //     //   group.position.copy(p);
  //     //   this.stage.add(group);

  //     //   Tweens.animateLightPath(group.scale, group.position, distance, time)
  //     //     .on("complete", () => this.stage.remove(group));
  //   }

  // }



  // private smashBrick(brick: Brick, impactPoint: Vector3, impactNormal: Vector3) {

  //   // var fractureImpulse = 250;
  //   let convexBreaker = new ConvexObjectBreaker();
  //   // var debris = convexBreaker.subdivideByImpact(brick, impactPoint, impactNormal, 1, 2);

  //   convexBreaker.prepareBreakableObject(brick, 1, impactPoint, impactNormal, true);
  //   console.log(brick)
  //   const derbis = createDebrisFromBreakableObject(brick);
  //   console.log(debris);

  // var numObjects = debris.length;
  // for (var j = 0; j < numObjects; j++) {

  //   var vel = rb0.getLinearVelocity();
  //   var angVel = rb0.getAngularVelocity();
  //   var fragment = debris[j];
  //   fragment.userData.velocity.set(vel.x(), vel.y(), vel.z());
  //   fragment.userData.angularVelocity.set(angVel.x(), angVel.y(), angVel.z());

  //   createDebrisFromBreakableObject(fragment);

  // }

  // objectsToRemove[numObjectsToRemove++] = threeObject0;
  // userData0.collided = true;

  // }

  // private createDebrisFromBreakableObject(object: Brick) {

  //   object.castShadow = true;
  //   object.receiveShadow = true;
  //   const mesh = object.children[0] as Mesh;
  //   const geometry = mesh.geometry as BufferGeometry;

  //   var shape = this.createConvexHullPhysicsShape(geometry.attributes.position.array);
  //   shape.setMargin(margin);

  //   var body = this.createRigidBody(object, shape, object.userData.mass, null, null, object.userData.velocity, object.userData.angularVelocity);

  //   // Set pointer back to the three object only in the debris objects
  //   var btVecUserData = new CANNO.btVector3(0, 0, 0);
  //   btVecUserData.threeObject = object;
  //   body.setUserPointer(btVecUserData);

  // }


  // createConvexHullPhysicsShape( points ) {

  //   var shape = new Ammo.btConvexHullShape();

  //   for ( var i = 0, il = points.length; i < il; i++ ) {
  //     var p = points[ i ];
  //     this.tempBtVec3_1.setValue( p.x, p.y, p.z );
  //     var lastOne = ( i === ( il - 1 ) );
  //     shape.addPoint( this.tempBtVec3_1, lastOne );
  //   }

  //   return shape;

  // }





  // private printMatrix(): void {
  //   // console.clear();
  //   console.log("----------------------------------")

  //    for (const x = 0; x < this.game.getRows(); x++) {

  //     let colors = new Array();
  //      for (const y = 0; y < this.game.getCols(); y++) {
  //       if (!player.matrix[x][y]) {
  //         colors.push("#fafafa");
  //       } else {
  //         colors.push('#'+(player.matrix[x][y].material as MeshPhongMaterial).color.getHexString());
  //       }

  //     }
  //     let num = "" + x;
  //     if (11 - x > 1) {
  //       num = " " + x;
  //     }

  //     console.log(num + '.  %c  %c %c  %c %c  %c %c  %c %c  %c %c  %c %c  %c %c  %c %c  %c %c  %c %c  %c %c  %c %c  %c %c  %c %c  ',
  //       `background:${colors[0]}`, 'backround:white',
  //       `background:${colors[1]}`, 'backround:white',
  //       `background:${colors[2]}`, 'backround:white',
  //       `background:${colors[3]}`, 'backround:white',
  //       `background:${colors[4]}`, 'backround:white',
  //       `background:${colors[5]}`, 'backround:white',
  //       `background:${colors[6]}`, 'backround:white',
  //       `background:${colors[7]}`, 'backround:white',
  //       `background:${colors[8]}`, 'backround:white',
  //       `background:${colors[9]}`, 'backround:white',
  //       `background:${colors[10]}`, 'backround:white',
  //       `background:${colors[11]}`, 'backround:white',
  //       `background:${colors[12]}`, 'backround:white',
  //       `background:${colors[13]}`, 'backround:white',
  //       `background:${colors[14]}`
  //     );

  //     // console.log(row);
  //   }
  // }



  // private initMatrices() {
  //   player.matrix = new Array();
  //    for (const x = 0; x < this.game.getRows(); x++) {
  //     player.matrix[x] = new Array();
  //      for (const y = 0; y < this.game.getCols(); y++) {
  //       player.matrix[x][y] = null;
  //     }
  //   }

  //   player.matrix = new Array();
  //    for (const x = 0; x < this.game.getRows(); x++) {
  //     player.matrix[x] = new Array();
  //      for (const y = 0; y < this.game.getCols(); y++) {
  //       player.matrix[x][y] = null;
  //     }
  //   }
  // }


  //  nextOpponent(player: Player) {
  //   this.storeBricks(player);
  //   player.block.updateMatrixWorld();

  //   //  for (const brick of player.block.bricks) {
  //   //   let vec3 = new Vector3().setFromMatrixPosition(brick.matrixWorld);
  //   //   brick.body.position.copy(vec3);
  //   //   brick.update();
  //   //   this.bricks.push(brick);
  //   //   this.stage.add(brick);
  //   // }
  // }

  //  fallOpponent(player: Player, command: MoveBlock): void {
  //   if (player.tween) player.tween.pause();
  //   let p = player.block.position;
  //   p.y = command.startPos;
  //   player.tween = Tweens.fall(p, command.endPos, command.duration);
  //   return player.tween;
  // }

  // private rotateOpponent(player: Player, direction: number): any {
  //   if (player.tween) player.tween.pause();
  //   return Tweens.rotate(player.block.rotation, direction, 100);
  // }

  // private moveOpponent(player: Player, direction: number): any {
  //   if (player.tween) player.tween.pause();
  //   return Tweens.move(player.block.position, direction, 100);
  // }


// private raycastArray(array: Array<any>, index: number, step: number): number {
//   let distance = 0;
//   while (!array[index]) {
//     index += step;
//     distance++;
//     if (distance >= index + array.length || index < 0) {
//       break;
//     }
//   }
//   return distance;
// }


// private raycastMatrixColObject(direction: number): number {
//
//   player.block.updateMatrixWorld();
//   let arr = new Array();
//    for (const mesh of player.block.getSubmeshes()) {
//     let vec3 = new Vector3();
//     vec3.setFromMatrixPosition(mesh.matrixWorld);
//
//     let x = this.game.getRows() - 1 - Math.floor(mesh.position.y);
//     let y = Math.floor(mesh.position.x);
//     // player.matrix[x][y]
//
//     arr.push(this.raycastMatrixCol(x, y, direction));
//   }
//   arr.sort((a, b) => a - b);
//   return arr[0];
// }

// private raycastMatrixCol(row: number, col: number, direction: number): number {
//   let distance: number = 0;
//   if (direction == -1) {
//      for (const y = col; y >= 0; y--) {
//       if (!player.matrix[row][y]) {
//         distance++;
//       } else {
//         return distance;
//       }
//     }
//     return col;
//   } else if (direction == 1) {
//      for (const y = col; y < this.game.getCols(); y++) {
//       if (!player.matrix[row][y]) {
//         distance++;
//       } else {
//         return distance;
//       }
//     }
//     return this.game.getCols() - col - 1;
//   }
//   return 0;
// }


// async burnBrick(brick: Brick) {
//   let fire = new Fire(this.fireTexture);
//   this.loadFireConfig(fire, this.fireConfigs['fall1']);
//   brick.add(fire);
//   fire.scale.set(2, 2.5, 2);
// }

// private loadFireConfig(fire: any, config: FireConfig): void {
//   fire.material.uniforms.magnitude.value = config.magnitude;
//   fire.material.uniforms.lacunarity.value = config.lacunarity;
//   fire.material.uniforms.gain.value = config.gain;
//   fire.material.uniforms.noiseScale.value = new THREE.Vector4(
//     config.noiseScaleX,
//     config.noiseScaleY,
//     config.noiseScaleZ,
//     0.3
//   );
// }


// private loadFireConfig(fire:Fire, config:FireConfig) : void {

// this.fire = new Fire(new PlaneBufferGeometry(10, 10), {
//   textureWidth: 512,
//   textureHeight: 512,
//   debug: true
// })
// this.loadFireConfig(this.fire, fireConfigs['Fireball']);
// this.fire.clearSources();
// this.fire.addSource( 0.45, 0.1, 0.1, 0.5, 0.0, 1.0 );



//   fire.color1 = new Color(config.color1);
//   fire.color2 = new Color(config.color2);
//   fire.color3 = new Color(config.color3);
//   fire.windVector.x = config.windX;
//   fire.windVector.y = config.windY;
//   fire.colorBias = config.colorBias;
//   fire.burnRate = config.burnRate;
//   fire.diffuse = config.diffuse;
//   fire.viscosity = config.viscosity;
//   fire.expansion = config.expansion;
//   fire.swirl = config.swirl;
//   fire.drag = config.drag;
//   fire.airSpeed = config.airSpeed;
//   fire.speed = config.speed;
//   fire.massConservation = config.massConservation;
// }



// private componentToHex(c): string {
//   let hex = c.toString(16);
//   return hex.length == 1 ? "0" + hex : hex;
// }

// private rgbToHex(r, g, b): string {
//   return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
// }
//
// // Must predict next position and check if the ray trajectory if it intersects anything!
// private raycastMeshes(vec1: Vector3, offset?: Vector3): number {
//   this.raycaster.far = 30000;
//   let min = this.raycaster.far;
//   player.block.updateMatrixWorld();
//   let arr = [];
//    for (const mesh of player.block.getSubmeshes()) {
//     let vec3 = new Vector3();
//     vec3.setFromMatrixPosition(mesh.matrixWorld);
//
//     if (offset) vec3.add(offset);
//
//     this.raycaster.set(vec3, vec1);
//     arr = this.raycaster.intersectObjects(this.meshes);
//     if (arr.length < 0) continue;
//
//      for (const item of arr) {
//       if (item.distance < min) {
//         min = item.distance;
//       }
//     }
//   }
//   return this.round(min);
// }
//

