import {CommonBot} from "./common";
import {ConsoleCasino} from "../console-casino";
import {ProgressiveRedBlack} from "../strategy/progressive-red-black";

export class RouletteBot extends CommonBot {
    constructor(driver) {
        super();
        this.driver = driver;
    }

    async start(strategyName, bagSize = 5.0, options = {}) {
        options = await this.getOptions(options);

        if (!(options.dryRun) && bagSize > await this.driver.getBalance()) {
            throw new Error('balance too low')
        }

        let taskID = await this.generateTaskID();
        let strategy = await this.getStrategy(taskID, strategyName, bagSize, options);

        await this.createTask(taskID, strategyName, Object.assign({}, strategy.results));

        while (this.getTask(taskID).active) {
            await strategy.runStrategy();
            await this.updateTaskResults(taskID, Object.assign({}, strategy.results));
            await this.sleep(1500);
        }
    }

    async backtest(strategyName, bagSize, options = {}) {
        let numbers; let strategy;

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
        if (!(ConsoleCasino.getStrategies().roulette.includes(strategyName))) {
            throw new Error('invalid strategy name ' + strategyName);
        }

        if (strategyName === 'progressive-red-black') {
            return new ProgressiveRedBlack(this.driver, taskID, bagSize, this.getOptions(options));
        }
    }
}