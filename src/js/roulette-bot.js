import {waitingForResults, winBet, loseBet} from "./constants";

import {StreakDozens} from "./strategy/streak-dozens";
import {StreakRedBlack} from "./strategy/streak-red-black";
import {PlaytechLiveRoulette} from "./casino/playtech-live-roulette";

import {sleep} from "./util";

class RouletteBot {
    constructor(stopLoss = 0) {
        this.active = true;
        this.stopLoss = stopLoss;
        this.createTime = Math.floor(Date.now() / 1000);

        this.roulette = new PlaytechLiveRoulette();

        this.betStrategies = [
            new StreakDozens(this.roulette, 2),
            new StreakDozens(this.roulette, 3),
            new StreakDozens(this.roulette, 4),
            new StreakDozens(this.roulette, 5),
            new StreakDozens(this.roulette, 6),
            new StreakRedBlack(this.roulette, 2),
            new StreakRedBlack(this.roulette, 3),
            new StreakRedBlack(this.roulette, 4),
            new StreakRedBlack(this.roulette, 5),
            new StreakRedBlack(this.roulette, 6),
            new StreakRedBlack(this.roulette, 7),
            new StreakRedBlack(this.roulette, 8),
        ];
    }

    async start(chipSize = 0.1) {
        let ts = Date.now() / 1000;

        while (this.active) {
            console.log('rouletteBot', 'running');

            let balance = await this.roulette.getBalance();
            let numbers = await this.roulette.getLastNumbers();
            let dealerMessage = await this.roulette.getDealerMessage().toLowerCase();

            if (this.stopLoss > 0 && balance <= this.stopLoss) {
                throw Error('stop loss limit reached');
            }

            for (let i = 0; i < this.betStrategies.length; i++) {
                if (dealerMessage === 'place your bets' || dealerMessage === 'last bets') {
                    await this.betStrategies[i].processBet(numbers, balance, chipSize);

                } else {
                    this.betStrategies[i].betState = waitingForResults;
                }
            }
            ts = await this.keepSessionAlive(ts);
            await sleep(3000);
        }
    }

    getRunningTime() {
        let timeDiff = Math.floor(Date.now() / 1000) - this.createTime;
        return Math.round(timeDiff / 60 / 60).toFixed(1) + ' hours';
    }

    getResults() {
        let data = {};

        for (let i = 0; i < this.betStrategies.length; i++) {
            let sum = 0;
            let wins = 0;
            let losses = 0;
            let name = this.betStrategies[i].name;

            for (let s = 0; s < this.betStrategies[i].results.length; s++) {
                sum += this.betStrategies[i].results[s].size;
            }

            for (let s = 0; s < this.betStrategies[i].results.length; s++) {
                wins += (this.betStrategies[i].results[s].status === winBet) ? 1 : 0;
            }

            for (let s = 0; s < this.betStrategies[i].results.length; s++) {
                losses += (this.betStrategies[i].results[s].status === loseBet) ? 1 : 0;
            }

            data[name] = {
                'results': this.betStrategies[i].results,
                'totalBets': this.betStrategies[i].results.length,
                'totalSum': sum,
                'totalWin': wins,
                'totalLose': losses
            };
        }

        return data;
    }

    keepSessionAlive(ts) {
        if (ts + 60 < Date.now() / 1000) {
            console.log('rouletteBot', 'session-keep-alive');
            this.roulette.viewStatistics();
            ts += 120;
        }

        return ts;
    }
}