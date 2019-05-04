import {waitingForResults} from "./constants";

import {StreakDozens} from "./strategy/streak-dozens";
import {StreakRedBlack} from "./strategy/streak-red-black";
import {PlaytechLiveRoulette} from "./casino/playtech-live-roulette";

import {sleep} from "./util";

class RouletteBot {
    constructor(stopLoss = 0) {
        this.active = true;
        this.stopLoss = stopLoss;
        this.roulette = new PlaytechLiveRoulette();

        this.betStrategies = [
            new StreakDozens(this.roulette),
            new StreakRedBlack(this.roulette),
        ];
    }

    async start(chipSize = 0.1) {
        let ts = Date.now() / 1000;
        let balance = await this.roulette.getBalance();

        while (this.active) {
            console.log('rouletteBot', 'running');

            let numbers = await this.roulette.getLastNumbers();
            let dealerMessage = await this.roulette.getDealerMessage().toLowerCase();

            if (this.stopLoss > 0 && balance <= this.stopLoss) {
                throw Error('stop loss limit reached');
            }

            for (let i = 0; i < this.betStrategies.length; i++) {
                if (dealerMessage === 'place your bets' || dealerMessage === 'last bets') {
                    balance += await this.betStrategies[i].processBet(numbers, balance, chipSize);

                } else {
                    this.betStrategies[i].betState = waitingForResults;
                }
            }
            ts = await this.keepSessionAlive(ts);
            await sleep(3000);
        }
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
                wins += (this.betStrategies[i].results[s].status === 'win') ? 1 : 0;
            }

            for (let s = 0; s < this.betStrategies[i].results.length; s++) {
                losses += (this.betStrategies[i].results[s].status === 'lose') ? 1 : 0;
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