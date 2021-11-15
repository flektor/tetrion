import { wrap } from 'comlink';
import { World } from 'src/app/engine/physics/world';
import { IWorld } from 'src/app/engine/physics/world.interface';
import { WorldWorkerAdapter } from './world-worker-adapter';

const createWorldWorker = async () => {
    const workerProxy = wrap<typeof import('../../worker/world.worker').World>(new Worker('../../worker/world.worker', { type: 'module', name: 'world.worker.js' }));
    return await new workerProxy();
}

export class WorldSwitcher {

    private static instance: WorldSwitcher;
    private world: IWorld;

    private constructor() { }


    static getInstance(): WorldSwitcher {
        if (this.instance) return this.instance;
        return this.instance = new WorldSwitcher();
    }


    async init(params: { cols: number, rows: number, useWorker?: boolean }): Promise<IWorld> {

        if (this.world) return;

        if (!params.useWorker) {
            this.world = new World(params.rows, params.cols);
            return this.world;
        }

        const positionsLength = params.cols * params.rows * 3 * 4;
        const positions = new SharedArrayBuffer(positionsLength);// cols * 4rows * 3(xyz values) * 4 bytes
        const quaternions = new SharedArrayBuffer(params.cols * params.rows * 4 * 4);// cols * 4rows * 4(xyzw values) * 4 bytes
        const offsetx = params.cols / 2;

        for (let i = 1; i < positionsLength - 1; i += 3) {
            positions[i - 1] = offsetx;
            positions[i] = -0.5;
            positions[i + 1] = 0;
        }

        const worker = await createWorldWorker();

        await worker.init(positions, quaternions);

        this.world = new WorldWorkerAdapter(worker, positions, quaternions);

        return this.world;
    }


    getInstance(): IWorld {
        return this.world;
    }
}
