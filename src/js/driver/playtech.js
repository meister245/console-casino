import { DriverCommon } from "./common";

export class Playtech extends DriverCommon {

    constructor() {
        super();

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
            0.10: 'chipsPanel.chip10', 0.20: 'chipsPanel.chip20', 0.25: 'chipsPanel.chip25',
            0.50: 'chipsPanel.chip50', 1: 'chipsPanel.chip100', 5: 'chipsPanel.chip500',
            10: 'chipsPanel.chip1000', 25: 'chipsPanel.chip2500', 100: 'chipsPanel.chip10000',
            500: 'chipsPanel.chip50000', 1000: 'chipsPanel.chip100000'
        };
    }

    getBalance() {
        let text = document.querySelector('[data-automation-locator="footer.balance"]').textContent;
        return parseFloat(text.match(/\d+(?:\.\d+)*/g)[0]);
    }

    getBetAmount() {
        let text = document.querySelector('[data-automation-locator="footer.betAmount"]').textContent;
        return parseFloat(text.match(/\d+(?:\.\d+)*/g)[0]);
    }

    getDealerMessage() {
        return document.querySelector('[class="dealer-message-text"]').textContent;
    }

    getDealerName() {
        return document.querySelector('[data-automation-locator="field.dealerNickname"]').textContent;
    }

    getExtendedHistory() {
        let numberHistoryParentElement = document.querySelector('[class^="roulette-history-extended__items"]');
        let numbers = [...numberHistoryParentElement.children].map(elem => parseInt(elem.textContent));
        return numbers.reverse();
    }

    getLastNumber() {
        let elem = document.querySelector('[data-automation-locator="field.lastHistoryItem"]');
        return parseInt(elem.textContent);
    }

    getLastNumbers() {
        let historyLineElement = document.querySelector('.roulette-game-area__history-line');
        let historyNumbersParentElement = historyLineElement.children[0];

        return [...historyNumbersParentElement.children].map(elem => parseInt(elem.textContent));
    }

    getWinAmount() {
        let elem = document.querySelector('[data-automation-locator="footer.winAmount"]');
        return parseFloat(elem.textContent.match(/[0-9]+(?:\.[0-9]+)*/g)[0]);
    }

    setBet(type) {
        this.simulatedClick(document.querySelector(`[data-automation-locator="${this.rouletteBetMapping[type]}"]`));
    }

    setBetDouble() {
        this.simulatedClick(document.querySelector('[data-automation-locator="button.Double"]'));
    }

    setBetUndo() {
        this.simulatedClick(document.querySelector('[data-automation-locator="button.Undo"]'));
    }

    setChipSize(size) {
        this.simulatedClick(document.querySelector(`[data-automation-locator="${this.chipMapping[size]}"]`));
    }

    viewTableLimits() {
        this.simulatedClick(document.querySelector('[data-automation-locator="button.limits"]'));
    }

    viewExtendedHistory() {
        this.simulatedClick(document.querySelector('[data-automation-locator="button.extenededHistory"]'));
    }

    viewStatistics() {
        this.simulatedClick(document.querySelector('[data-automation-locator="button.statistic"]'));
    }

    viewStatisticsChart() {
        this.simulatedClick(document.querySelector('[data-automation-locator="button.StatisticChart"]'));
    }
}