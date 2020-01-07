import {DriverCommon} from "./common";

export class Playtech extends DriverCommon {
    constructor() {
        super();
        this.dataLocatorAttrName = 'data-automation-locator';
        this.rouletteBetMapping = {
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
        this.chipMapping = {
            0.10: 'chip_rate-10', 0.25: 'chip_rate-25', 0.50: 'chip_rate-50', 1: 'chip_rate-100',
            5: 'chip_rate-500', 10: 'chip_rate-1000', 25: 'chip_rate-2500', 100: 'chip_rate-10000',
            500: 'chip_rate-50000', 1000: 'chip_rate-100000'
        };
    }

    getBalance() {
        let text = this.getElementByAttribute(this.dataLocatorAttrName, 'footer.balance').textContent;
        return parseFloat(text.match(/[0-9]+(?:\.[0-9]+)*/g)[0]);
    }

    getBetAmount() {
        let text = this.getElementByAttribute(this.dataLocatorAttrName, 'footer.betAmount').textContent;
        return parseFloat(text.match(/[0-9]+(?:\.[0-9]+)*/g)[0]);
    }

    getDealerMessage() {
        return document.getElementsByClassName('dealer-message-text')[0].textContent;
    }

    getDealerName() {
        return document.getElementsByClassName('header__dealer-name')[0].textContent;
    }

    getExtendedHistory() {
        let numbers = [];
        let elements = document.getElementsByClassName('roulette-history-items')[0].innerText.split('\n');

        for (let i in elements) {
            numbers.push(parseInt(elements[i]))
        }

        return numbers;
    }

    getLastNumber() {
        return parseInt(this.getElementByAttribute(this.dataLocatorAttrName, 'field.lastHistoryItem').textContent);
    }

    getLastNumbers() {
        let numbers = [];
        let elements = document.getElementsByClassName('roulette-history-line')[0].innerText.split('\n');

        for (let i in elements) {
            numbers.push(parseInt(elements[i]));
        }

        return numbers;
    }

    getWinAmount() {
        let elem = this.getElementByAttribute(this.dataLocatorAttrName, 'footer.winAmount');
        return parseFloat(elem.textContent.match(/[0-9]+(?:\.[0-9]+)*/g)[0]);
    }

    setBet(type) {
        this.simulatedClick(this.getElementByAttribute(this.dataLocatorAttrName, this.rouletteBetMapping[type]));
    }

    setBetDouble() {
        this.simulatedClick(document.getElementsByClassName('action-button_double')[0]);
    }

    setBetUndo() {
        this.simulatedClick(document.getElementsByClassName('action-button_undo')[0]);
    }

    setChipSize(size) {
        this.simulatedClick(document.getElementsByClassName(this.chipMapping[size])[0]);
    }

    viewExtendedHistory() {
        this.simulatedClick(this.getElementByAttribute(this.dataLocatorAttrName, 'button.extenededHistory'));
    }

    viewStatistics() {
        this.simulatedClick(this.getElementByAttribute(this.dataLocatorAttrName, 'button.statistic'));
    }
}