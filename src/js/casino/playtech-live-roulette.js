import {simulatedClick, getElementByAttribute} from "../util";


export class PlaytechLiveRoulette {
    constructor() {
        this.dataLocatorAttrName = 'data-automation-locator';

        this.chipMapping = {
            0.10: 'chip_rate-10', 0.25: 'chip_rate-25', 0.50: 'chip_rate-50', 1: 'chip_rate-100',
            5: 'chip_rate-500', 10: 'chip_rate-1000', 25: 'chip_rate-2500', 100: 'chip_rate-10000',
            500: 'chip_rate-50000', 1000: 'chip_rate-100000'
        };

        this.betMapping = {
            'low': 'betPlace.spots50x50-1to18',
            'even': 'betPlace.spots50x50-even',
            'red': 'betPlace.spots50x50-red',
            'black': 'betPlace.spots50x50-black',
            'odd': 'betPlace.spots50x50-odd',
            'high': 'betPlace.spots50x50-19to36',
            'columnTop': 'betPlace.column-3',
            'columnMiddle': 'betPlace.column-2',
            'columnBottom': 'betPlace.column-1',
            'firstDozen': 'betPlace.dozen-1st12',
            'secondDozen': 'betPlace.dozen-2nd12',
            'thirdDozen': 'betPlace.dozen-3rd12'
        };

        Object.freeze(this);
    }

    getBalance() {
        let text = getElementByAttribute(this.dataLocatorAttrName, 'footer.balance').textContent;
        return parseFloat(text.match(/[0-9]+(?:\.[0-9]+)*/g)[0]);
    }

    getBetAmount() {
        let text = getElementByAttribute(this.dataLocatorAttrName, 'footer.betAmount').textContent;
        return parseFloat(text.match(/[0-9]+(?:\.[0-9]+)*/g)[0]);
    }

    getDealerMessage() {
        return document.getElementsByClassName('dealer-message-text')[0].textContent;
    }

    getDealerName() {
        return document.getElementsByClassName('header__dealer-name')[0].textContent;
    }

    getLastNumber() {
        return this.getLastNumbers()[0];
    }

    getLastNumbers() {
        let numbers = [];
        let elements = document.getElementsByClassName('roulette-history-line-item');

        for (let i = 0; i < elements.length; i++) {
            numbers.push(parseInt(elements[i].textContent));
        }

        return numbers;
    }

    getWinAmount() {
        let elem = getElementByAttribute(this.dataLocatorAttrName, 'footer.winAmount');
        return parseFloat(elem.textContent.match(/[0-9]+(?:\.[0-9]+)*/g)[0]);
    }

    setBet(type) {
        let elem = getElementByAttribute(this.dataLocatorAttrName, this.betMapping[type]);
        simulatedClick(elem);
    }

    setBetDouble() {
        let elem = document.getElementsByClassName('action-button_double')[0];
        simulatedClick(elem);
    }

    setBetUndo() {
        let elem = document.getElementsByClassName('action-button_undo')[0];
        simulatedClick(elem);
    }

    setChipSize(size) {
        let elem = document.getElementsByClassName(this.chipMapping[size])[0];
        simulatedClick(elem);
    }

    viewStatistics() {
        let elem = getElementByAttribute(this.dataLocatorAttrName, 'button.statistic');
        simulatedClick(elem);
    }
}