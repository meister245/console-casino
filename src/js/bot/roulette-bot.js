import {ConsoleBot} from "./console-bot";
import {ProgressiveRedBlack} from "../strategy/progressive-red-black";

class RouletteBot extends ConsoleBot {
    constructor(driverName) {
        super();
        this.driver = this.getDriver(driverName);
    }

    async start(strategyName, bagSize, options) {
        options = await this.getOptions(options);

        if (!(options.dryRun) && bagSize > await this.driver.getBalance()) {
            throw new Error('balance too low')
        }

        let taskID = await this.generateTaskID();
        let strategy = await this.getStrategy(this.driver, taskID, strategyName, bagSize, options);

        await this.createTask(taskID, 'roulette', strategyName, Object.assign({}, strategy.results));

        while (this.getTask(taskID).active) {
            try {
                await strategy.runStrategy();
                await this.updateTaskResults(taskID, Object.assign({}, strategy.results));
                await this.sleep(1500);

            } catch (e) {
                await this.stop(taskID);
                console.log(e);
            }
        }
    }

    getStrategy(driver, taskID, strategyName, bagSize, options) {
        if (strategyName === 'progressive-red-black') {
            return new ProgressiveRedBlack(driver, taskID, bagSize, options);
        }

        throw new Error('strategy not found: ' + strategyName);
    }
}