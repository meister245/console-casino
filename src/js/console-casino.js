import {RouletteBot} from "./bot/roulette-bot";
import {Playtech} from "./driver/playtech";

export class ConsoleCasino {
    constructor(driverName) {
        this.roulette = new RouletteBot(this.getDriver(driverName));
    }

    getDriver(driverName, gameType) {
        if (!(ConsoleCasino.getDrivers(gameType).includes(driverName))) {
            throw new Error('invalid driver name ' + driverName);
        }

        if (driverName === 'playtech') {
            return new Playtech();
        }
    }

    static getDrivers() {
        return ['playtech']
    }

    static getStrategies() {
        return {roulette: ['progressive-red-black']}
    }
}