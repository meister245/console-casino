import {StrategyCommon} from "./common";
import {rouletteBlackNumbers, rouletteRedNumbers, stageSpin, stageBet, stageResults, stageWait} from "../constants";

export class ProgressiveRedBlack extends StrategyCommon {
    constructor(driver, taskID, bagSize, options) {
        super();
        this.driver = driver;
        this.taskID = taskID;
        this.options = options || {};

        this.results = {
            gameWin: 0,
            gameLost: 0,
            profit: 0
        };

        this.gameState = {
            bet: {},
            betMultiplier: 1,
            bagSize: bagSize.valueOf(),
            bagSizeCurrent: bagSize.valueOf(),
            stage: stageSpin
        };
    }

    runStrategy() {
        if (this.gameState.stage === stageSpin) {
            this.runStageSpin();
        } else if (this.gameState.stage === stageBet) {
            this.runStageBet();
        } else if (this.gameState.stage === stageResults) {
            this.runStageResult();
        } else if (this.gameState.stage === stageWait) {
            this.runStageWait();
        }
    }

    runStageSpin() {
        let dealerMessage = this.driver.getDealerMessage().toLowerCase();

        if (dealerMessage === 'wait for the next round') {
            console.log(this.taskID, 'stage', 'spin');
            this.gameState.stage = stageBet;
        }
    }

    runStageBet() {
        let betName = null;
        let betMapping = null;
        let dryRun = true;
        let chipSize = 0.2;

        let lastNumber = this.driver.getLastNumber();
        let dealerMessage = this.driver.getDealerMessage().toLowerCase();

        if (dealerMessage === 'place your bets' || dealerMessage === 'last bets') {
            console.log(this.taskID, 'stage', 'bet');

            if (rouletteRedNumbers.includes(lastNumber)) {
                betName = 'red';
                betMapping = this.driver.rouletteBetMapping.red;

            } else if (rouletteBlackNumbers.includes(lastNumber)) {
                betName = 'black';
                betMapping = this.driver.rouletteBetMapping.black;
            }

            console.log(this.taskID, 'lastNumber', lastNumber);

            if (betName === null) {
                this.gameState.bet = {'null': 0};

            } else if (this.gameState.bagSizeCurrent < this.gameState.betMultiplier * chipSize) {
                throw new Error('out of money');

            } else if (Object.keys(this.gameState.bet).length === 0) {
                for (let i = 1; i <= this.gameState.betMultiplier; i++) {
                    if (!dryRun) {
                        this.driver.setChipSize(chipSize);
                        this.driver.setBet(betMapping);
                    }
                    this.gameState.bagSizeCurrent -= chipSize;
                }

                console.log(this.taskID, 'bet', betName, 'size', this.gameState.betMultiplier * chipSize);
                console.log(this.taskID, 'bagsize', this.gameState.bagSizeCurrent);

                this.gameState.bet[betName] = this.gameState.betMultiplier * chipSize;
            }

            this.gameState.stage = stageWait;
        }
    }

    runStageWait() {
        let dealerMessage = this.driver.getDealerMessage().toLowerCase();

        if (dealerMessage === 'wait for the next round') {
            console.log(this.taskID, 'stage', 'wait');
            this.gameState.stage = stageResults;
        }
    }

    runStageResult() {
        let resultName = null;
        let lastNumber = this.driver.getLastNumber();
        let dealerMessage = this.driver.getDealerMessage().toLowerCase();

        if (dealerMessage === 'place your bets' || dealerMessage === 'last bets') {
            console.log(this.taskID, 'stage', 'result');

            if (rouletteBlackNumbers.includes(lastNumber)) {
                resultName = 'black';
            } else if (rouletteRedNumbers.includes(lastNumber)) {
                resultName = 'red';
            }

            console.log(this.taskID, 'lastNumber', lastNumber);

            if (this.gameState.bet.hasOwnProperty('null')) {
                this.gameState.bet = {};

            } else if (this.gameState.bet.hasOwnProperty(resultName)) {
                console.log(this.taskID, 'result', 'win');
                this.gameState.bagSizeCurrent += this.gameState.bet[resultName] * 2;

                if (this.gameState.bagSizeCurrent > this.gameState.bagSize) {
                    this.results.profit += this.gameState.bagSizeCurrent - this.gameState.bagSize;
                    this.gameState.bagSizeCurrent = this.gameState.bagSize.valueOf();
                    console.log(this.taskID, 'profit', this.results.profit);
                }

                this.results.gameWin += 1;
                this.gameState.betMultiplier = 1;
                this.gameState.bet = {};

            } else if (Object.keys(this.gameState.bet).length > 0) {
                console.log(this.taskID, 'result', 'lose');
                this.results.gameLost += 1;
                this.gameState.betMultiplier *= 2;
                this.gameState.bet = {};
            }

            console.log(this.taskID, 'bagsize', this.gameState.bagSizeCurrent);
            this.gameState.stage = stageBet;
        }
    }
}