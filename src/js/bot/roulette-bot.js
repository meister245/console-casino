import {ConsoleBot} from "./console-bot";
import {ProgressiveRedBlack} from "../strategy/progressive-red-black";

class RouletteBot extends ConsoleBot {
    constructor(driverName) {
        super();
        this.driver = this.getDriver(driverName);
    }

    async start(strategyName, bagSize, options) {
        let balance = this.driver.getBalance();

        if (bagSize > balance) {
            throw new Error('balance too low')
        }

        let taskID = await this.generateTaskID();
        let strategy = await this.getStrategy(this.driver, strategyName, bagSize, options);

        await this.createTask(taskID, 'roulette', strategyName, Object.assign({}, strategy.results));

        while (this.getTask(taskID).active) {
            console.log('running task ID: ' + taskID);

            await strategy.runStrategy();
            await this.updateTaskResults(taskID, Object.assign({}, strategy.results));
            await this.sleep(3000);
        }
    }

    getStrategy(driver, strategyName, bagSize, options) {
        if (strategyName === 'progressive-red-black') {
            return new ProgressiveRedBlack(driver, bagSize, options);
        }

        throw new Error('strategy not found: ' + strategyName);
    }
}