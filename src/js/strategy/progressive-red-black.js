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
        let lastNumber = this.driver.getLastNumber();
        let dealerMessage = this.driver.getDealerMessage().toLowerCase();

        if (this.gameState.stage === stageSpin) {
            this.runStageSpin(dealerMessage);

        } else if (this.gameState.stage === stageBet) {
            this.runStageBet(dealerMessage, lastNumber);

        } else if (this.gameState.stage === stageWait) {
            this.runStageWait(dealerMessage);

        } else if (this.gameState.stage === stageResults) {
            this.runStageResult(dealerMessage, lastNumber);

        }
    }

    runStageSpin(dealerMessage) {
        if (dealerMessage === 'wait for the next round') {
            console.log(this.taskID, 'stage', 'spin');
            this.gameState.stage = stageBet;
        }
    }

    runStageBet(dealerMessage, lastNumber) {
        let betName = null;
        let betMapping = null;
        let dryRun = true;
        let chipSize = 0.2;
        let msg = [this.taskID, 'stage', 'bet'];
        let totalBet = this.gameState.betMultiplier * chipSize;

        if (dealerMessage === 'place your bets' || dealerMessage === 'last bets') {
            if (rouletteRedNumbers.includes(lastNumber)) {
                betName = 'red';
                betMapping = this.driver.rouletteBetMapping.red;

            } else if (rouletteBlackNumbers.includes(lastNumber)) {
                betName = 'black';
                betMapping = this.driver.rouletteBetMapping.black;
            }

            msg.push('lastNumber', lastNumber);

            if (betName === null) {
                this.gameState.bet = {'null': 0};

            } else if (this.gameState.bagSizeCurrent < totalBet) {
                throw new Error('out of money');

            } else if (Object.keys(this.gameState.bet).length === 0) {
                for (let i = 1; i <= this.gameState.betMultiplier; i++) {
                    if (!dryRun) {
                        this.driver.setChipSize(chipSize);
                        this.driver.setBet(betMapping);
                    }
                    this.gameState.bagSizeCurrent -= chipSize;
                }

                msg.push('bet', betName, totalBet.toFixed(2));

                this.gameState.bet[betName] = totalBet;
            }

            this.gameState.stage = stageWait;

            console.log(msg.join(' '));
        }
    }

    runStageWait(dealerMessage) {
        if (dealerMessage === 'wait for the next round') {
            console.log(this.taskID, 'stage', 'wait');
            this.gameState.stage = stageResults;
        }
    }

    runStageResult(dealerMessage, lastNumber) {
        let resultName = null;
        let msg = [this.taskID, 'stage', 'result'];

        if (dealerMessage === 'place your bets' || dealerMessage === 'last bets') {
            if (rouletteBlackNumbers.includes(lastNumber)) {
                resultName = 'black';

            } else if (rouletteRedNumbers.includes(lastNumber)) {
                resultName = 'red';
            }

            if (this.gameState.bet.hasOwnProperty('null')) {
                msg.push('N/A');

                this.gameState.bet = {};

            } else if (this.gameState.bet.hasOwnProperty(resultName)) {
                msg.push('win');

                this.gameState.bagSizeCurrent += this.gameState.bet[resultName] * 2;

                if (this.gameState.bagSizeCurrent > this.gameState.bagSize) {
                    this.results.profit += this.gameState.bagSizeCurrent - this.gameState.bagSize;
                    this.gameState.bagSizeCurrent = this.gameState.bagSize.valueOf();
                    this.gameState.betMultiplier = 1;
                }

                this.results.gameWin += 1;
                this.gameState.bet = {};
                this.gameState.betMultiplier -= (this.gameState.betMultiplier === 1) ? 0 : 1;

            } else if (Object.keys(this.gameState.bet).length > 0) {
                msg.push('lose');

                this.results.gameLost += 1;
                this.gameState.bet = {};
                this.gameState.betMultiplier += 1;
            }

            msg.push('bagsize', this.gameState.bagSizeCurrent.toFixed(2));
            msg.push('profit', this.results.profit.toFixed(2));

            this.gameState.stage = stageBet;

            console.log(msg.join(' '));
        }
    }
}