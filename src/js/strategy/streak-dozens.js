import {winBet, loseBet} from "../constants";

import {StrategyCommon} from "./common";


export class StreakDozens extends StrategyCommon {
    constructor(roulette) {
        super(roulette);
        this.name = 'streak-dozens';
    }

    getBetResult(numbers, chipSize) {
        let balanceChange = 0;
        let lastNumber = numbers[0];

        if (this.bets.length > 0) {
            let winLose;

            if (lastNumber === 0) {
                winLose = loseBet;
            } else if (this.bets.toString() === "secondDozen,thirdDozen") {
                winLose = (lastNumber <= 12) ? loseBet : winBet;
            } else if (this.bets.toString() === "firstDozen,thirdDozen") {
                winLose = (13 <= lastNumber && lastNumber <= 25) ? loseBet : winBet;
            } else if (this.bets.toString() === "firstDozen,secondDozen") {
                winLose = (25 <= lastNumber) ? loseBet : winBet;
            }

            balanceChange = this.registerResult(winLose, balanceChange, numbers, this.name, chipSize, 0.5);
        }
        return balanceChange;
    }

    getBetSignal(numbers) {
        let result = [];

        for (let i = 0; i < numbers.length; i++) {
            if (numbers[i] === 0) {
                result.push(0);
            } else if (1 <= numbers[i] && numbers[i] <= 12) {
                result.push(1);
            } else if (13 <= numbers[i] && numbers[i] <= 24) {
                result.push(2);
            } else if (25 <= numbers[i] && numbers[i] <= 36) {
                result.push(3);
            }
        }

        let subset = result.slice(0, 4).toString();

        if (subset === "1,1,1,0" || subset === "1,1,1,2" || subset === "1,1,1,3") {
            console.log('rouletteBot', this.name, 'signal found', 'firstDozen', numbers);
            this.bets = ['secondDozen', 'thirdDozen'];
            return true;
        } else if (subset === "2,2,2,0" || subset === "2,2,2,1" || subset === "2,2,2,3") {
            console.log('rouletteBot', this.name, 'signal found', 'secondDozen', numbers);
            this.bets = ['firstDozen', 'thirdDozen'];
            return true;
        } else if (subset === "3,3,3,0" || subset === "3,3,3,1" || subset === "3,3,3,2") {
            console.log('rouletteBot', this.name, 'signal found', 'thirdDozen', numbers);
            this.bets = ['firstDozen', 'secondDozen'];
            return true;
        }

        return false;
    }
}