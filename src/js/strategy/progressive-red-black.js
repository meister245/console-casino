import {StrategyCommon} from "./common";

export class ProgressiveRedBlack extends StrategyCommon {
    constructor(driver, bagSize, options) {
        super(driver);
        this.bagSize = bagSize;
        this.options = options || {};
    }

    runStrategy() {
        let balance = this.driver.getBalance();
        let numbers = this.driver.getLastNumbers();
        let dealerMessage = this.driver.getDealerMessage().toLowerCase();

    }
}