import {redNumbers, blackNumbers, winBet, loseBet} from "../constants";

import {StrategyCommon} from "./common";


export class StreakRedBlack extends StrategyCommon {
    constructor(roulette) {
        super(roulette);
        this.name = 'streak-red-black';
    }

    getBetResult(numbers, chipSize) {
        let balanceChange = 0;
        let lastNumber = numbers[0];

        if (this.bets.length > 0) {
            let winLose;

            if (lastNumber === 0) {
                winLose = loseBet;
            } else if (this.bets.toString() === "red") {
                winLose = (redNumbers.includes(lastNumber) ? winBet : loseBet);
            } else if (this.bets.toString() === "black") {
                winLose = (blackNumbers.includes(lastNumber) ? winBet : loseBet);
            }

            balanceChange = this.registerResult(winLose, balanceChange, numbers, this.name, chipSize, 1);
        }
        return balanceChange;
    }

    getBetSignal(numbers) {
        let result = [];

        for (let i = 0; i < numbers.length; i++) {
            if (numbers[i] === 0) {
                result.push("g");
            } else if (redNumbers.includes(numbers[i])) {
                result.push("r");
            } else if (blackNumbers.includes(numbers[i])) {
                result.push("b");
            }
        }

        let subset = result.slice(0, 3).toString();

        if (subset === "r,r,g" || subset === "r,r,b") {
            console.log('rouletteBot', this.name, 'signal found', 'black', numbers);
            this.bets = ['black'];
            return true;
        } else if (subset === "b,b,g" || subset === "b,b,r") {
            console.log('rouletteBot', this.name, 'signal found', 'red', numbers);
            this.bets = ['red'];
            return true;
        }

        return false;
    }
}