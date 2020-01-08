import {ConsoleBot} from "./console-bot";
import {ProgressiveRedBlack} from "../strategy/progressive-red-black";

class RouletteBot extends ConsoleBot {
    constructor(driverName = '') {
        super();
        this.driver = this.getDriver(driverName);
    }

    async start(strategyName, bagSize = 5.0, options = {}) {
        options = await this.getOptions(options);

        if (!(options.dryRun) && bagSize > await this.driver.getBalance()) {
            throw new Error('balance too low')
        }

        let taskID = await this.generateTaskID();
        let strategy = await this.getStrategy(taskID, strategyName, bagSize, options);

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

    async backtest(strategyName, bagSize = 5.0, options = {}) {
        let numbers;
        let strategy;

        options = await this.getOptions(options);
        options.dryRun = true;

        try {
            numbers = await this.driver.getExtendedHistory();
        } catch (e) {
            await this.driver.viewExtendedHistory();
            numbers = await this.driver.getExtendedHistory();
        } finally {
            strategy = await this.getStrategy('backtest', strategyName, bagSize, options);
            await strategy.runBacktest(numbers);
        }
    }

    getStrategy(taskID, strategyName, bagSize, options) {
        if (strategyName === 'progressive-red-black') {
            return new ProgressiveRedBlack(this.driver, taskID, bagSize, this.getOptions(options));
        }

        throw new Error('strategy not found: ' + strategyName);
    }
}