import {StrategyCommon} from "./common";

export class ProgressiveRedBlack extends StrategyCommon {
    constructor() {
        super();
    }

    runStrategy(driver, bagSize) {
        let balance = driver.getBalance();
        let numbers = driver.getLastNumbers();
        let dealerMessage = driver.getDealerMessage().toLowerCase();

        console.log(balance);
        console.log(numbers);
        console.log(dealerMessage);

    }
}