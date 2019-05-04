import {waitingForResults, waitingForSignal, waitingForBet, winBet, loseBet} from "../constants";

export class StrategyCommon {
    constructor(roulette) {
        this.bets = [];
        this.results = [];
        this.betState = waitingForSignal;
        this.betPlaced = false;

        this.roulette = roulette;
    }

    processBet(numbers, balance, chipSize = 0.1) {
        let balanceChange = 0;

        if (this.betState === waitingForResults) {
            balanceChange = this.getBetResult(numbers, chipSize);
            this.betState = waitingForSignal;
            this.betPlaced = false;
            this.bets = [];
        }

        if (this.betState === waitingForSignal) {
            let signalResult = this.getBetSignal(numbers);
            this.betState = (signalResult) ? waitingForBet : waitingForSignal;
        }

        if (this.betState === waitingForBet) {
            this.placeBets(balance, chipSize);
        }

        return balanceChange;
    }

    placeBets(balance, chipSize) {
        if (this.bets.length > 0 && !(this.betPlaced)) {
            this.roulette.setChipSize(chipSize);

            if (this.bets.length * chipSize >= balance) {
                throw Error('not enough balance');
            }

            for (let i = 0; i < this.bets.length; i++) {
                console.log('rouletteBot', 'placing bet', this.bets[i], chipSize);
                // this.roulette.setBet(this.bets[i]);
            }
            this.betPlaced = true;
        }
    }

    registerResult(winLose, balanceChange, numbers, strategyName, chipSize, payoutModifier) {
        switch (winLose) {
            case winBet:
                balanceChange = Math.abs(this.bets.length * chipSize) * payoutModifier;
                console.log('rouletteBot', strategyName, 'won bet');
                this.results.push({
                    'status': 'won',
                    'size': balanceChange,
                    'numbers': numbers,
                    'bets': this.bets,
                    'ts': Math.floor(Date.now() / 1000)
                });
                break;
            case loseBet:
                balanceChange = Math.abs(this.bets.length * chipSize) * -1;
                console.log('rouletteBot', strategyName, 'lost bet');
                this.results.push({
                    'status': 'lose',
                    'size': balanceChange,
                    'numbers': numbers,
                    'bets': this.bets,
                    'ts': Math.floor(Date.now() / 1000)
                });
                break;
        }
        return balanceChange;
    }

    getBetSignal() {
        throw Error('abstract method');
    }

    getBetResult() {
        throw Error('abstract method');
    }
}