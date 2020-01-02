import {ConsoleBot} from "./console-bot";
import {PlaytechLiveRoulette} from "../driver/playtech-live-roulette";
import {ProgressiveRedBlack} from "../strategy/progressive-red-black";

class RouletteBot extends ConsoleBot {
    constructor(driverName) {
        super();
        this.driver = this.getDriver(driverName);
    }

    async runTask(strategyName, bagSize) {
        let taskID = await this.generateTaskID();
        await this.createTask(strategyName, bagSize);

        console.log('running task ID: ' + taskID);

        let strategy = await this.getStrategy(strategyName);

        while (this.isActiveTask(taskID)) {
            await strategy.runStrategy(this.driver, bagSize);
            await this.updateTask(taskID, strategyName, bagSize, Object.assign({}, strategy));
            await this.sleep(3000);
        }
    }

    createTask(taskID, strategyName, bagSize, results = {}) {
        this.updateTask(taskID, {
            active: true,
            bagSize: bagSize,
            createTime: Math.floor(Date.now() / 1000),
            strategy: strategyName,
            results: results
        });
    }

    getStrategy(strategyName) {
        if (strategyName === 'progressive-red-black') {
            return new ProgressiveRedBlack();
        }

        throw new Error('strategy not found: ' + strategyName);
    }

    getDriver(driverName) {
        if (driverName === 'playtech') {
            return new PlaytechLiveRoulette();
        }

        throw new Error('driver not found: ' + driverName);
    }
}