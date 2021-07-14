import DriverCommon from "./common";

interface DriverSelectors {
  chip: ChipSelectors;
  roulette: RouletteSelectors;
}

interface ChipSelectors {
  [item: number]: string;
}

interface RouletteSelectors {
  [item: string]: string;
}

class Playtech extends DriverCommon {
  selectors: DriverSelectors;

  constructor() {
    super();

    this.selectors = {
      chip: {
        0.1: "chipsPanel.chip10",
        0.2: "chipsPanel.chip20",
        0.25: "chipsPanel.chip25",
        0.5: "chipsPanel.chip50",
        1: "chipsPanel.chip100",
        5: "chipsPanel.chip500",
        10: "chipsPanel.chip1000",
        25: "chipsPanel.chip2500",
        100: "chipsPanel.chip10000",
        500: "chipsPanel.chip50000",
        1000: "chipsPanel.chip100000",
      },
      roulette: {
        even: "betPlace.spots50x50-even",
        odd: "betPlace.spots50x50-odd",
        red: "betPlace.spots50x50-red",
        black: "betPlace.spots50x50-black",
        low: "betPlace.spots50x50-1to18",
        high: "betPlace.spots50x50-19to36",
        columnBottom: "betPlace.column-1",
        columnMiddle: "betPlace.column-2",
        columnTop: "betPlace.column-3",
        dozenFirst: "betPlace.dozen-1st12",
        dozenSecond: "betPlace.dozen-2nd12",
        dozenThird: "betPlace.dozen-3rd12",
        lineOne: "betPlace.line-1-2-3-4-5-6",
        lineTwo: "betPlace.line-4-5-6-7-8-9",
        lineThree: "betPlace.line-7-8-9-10-11-12",
        lineFour: "betPlace.line-10-11-12-13-14-15",
        lineFive: "betPlace.line-13-14-15-16-17-18",
        lineSix: "betPlace.line-16-17-18-19-20-21",
        lineSeven: "betPlace.line-19-20-21-22-23-24",
        lineEight: "betPlace.line-22-23-24-25-26-27",
        lineNine: "betPlace.line-25-26-27-28-29-30",
        lineTen: "betPlace.line-28-29-30-31-32-33",
        lineEleven: "betPlace.line-31-32-33-34-35-36",
      },
    };
  }

  getLobbyTables(): NodeListOf<HTMLElement> {
    return document.querySelectorAll(".lobby-table__container");
  }

  navigateLobbyTable(tableRegex: string): boolean {
    for (const table of this.getLobbyTables()) {
      const lobbyTableName =
        table.querySelector(".lobby-table__name-container")?.textContent ?? "";

      const transformedName = lobbyTableName.replace(/\s/g, "-").toLowerCase();

      if (transformedName.match(tableRegex)) {
        this.simulatedClick(table);
        return true;
      }
    }

    return false;
  }

  getMessages(): string[] {
    return [...document.querySelectorAll(".modal-confirm_desktop")].map((msg) =>
      msg.textContent.toLowerCase()
    );
  }

  getBalance(): number {
    const text =
      document.querySelector('[data-automation-locator="footer.balance"]')
        ?.textContent ?? "";
    return parseFloat(text.match(/\d+(?:\.\d+)*/g)[0]);
  }

  getBetAmount(): number {
    const text =
      document.querySelector('[data-automation-locator="footer.betAmount"]')
        ?.textContent ?? "";
    return parseFloat(text.match(/\d+(?:\.\d+)*/g)[0]);
  }

  getChipSizes(): number[] {
    return [...document.querySelectorAll(".chip-svg")]
      .map((item: Element) =>
        parseFloat(item.textContent.replace(/[Kk]/, "000"))
      )
      .sort();
  }

  getDealerMessage(): string {
    return document.querySelector(".dealer-message-text")?.textContent ?? "";
  }

  getDealerName(): string {
    return (
      document.querySelector('[data-automation-locator="field.dealerNickname"]')
        ?.textContent ?? ""
    );
  }

  getNumberHistory(): number[] {
    try {
      const numberHistoryParentElement = document.querySelector(
        '[class^="roulette-history-extended__items"]'
      );
      const numberHistoryElements = numberHistoryParentElement.querySelectorAll(
        "[class^=roulette-history-item__value-text]"
      );
      return [...numberHistoryElements].map((elem) =>
        parseInt(elem.textContent, 10)
      );
    } catch {
      this.toggleExtendedHistory();
      return this.getNumberHistory();
    }
  }

  getLastNumber(): number {
    const elem = document.querySelector(
      '[data-automation-locator="field.lastHistoryItem"]'
    ) as HTMLElement;
    return parseInt(elem.textContent, 10);
  }

  getLastNumbers(): number[] {
    const historyLineElement = document.querySelector(
      ".roulette-game-area__history-line"
    );
    const historyNumbersParentElement = historyLineElement.children[0];

    return [...historyNumbersParentElement.children].map((elem) =>
      parseInt(elem.textContent, 10)
    );
  }

  getTableName(): string {
    const tableName =
      document.querySelector(".table-info__name")?.textContent ?? "";
    return tableName.replace(/\s/g, "-").toLowerCase();
  }

  getWinAmount(): number {
    const elem = document.querySelector(
      '[data-automation-locator="footer.winAmount"]'
    );
    return parseFloat(elem.textContent.match(/[0-9]+(?:\.[0-9]+)*/g)[0]);
  }

  setBet(type: string): void {
    this.simulatedClick(
      document.querySelector(
        `[data-automation-locator="${this.selectors.roulette[type]}"]`
      )
    );
  }

  setBetDouble(): void {
    this.simulatedClick(
      document.querySelector('[data-automation-locator="button.Double"]')
    );
  }

  setBetUndo(): void {
    this.simulatedClick(
      document.querySelector('[data-automation-locator="button.Undo"]')
    );
  }

  setChipSize(size: number): void {
    this.simulatedClick(
      document.querySelector(
        `[data-automation-locator="${this.selectors.chip[size]}"]`
      )
    );
  }

  closeMessages(): void {
    document
      .querySelectorAll('[data-automation-locator="popup.button.resolve"]')
      .forEach((elem: Element) => this.simulatedClick(elem));
  }

  toggleTableLimits(): void {
    this.simulatedClick(
      document.querySelector('[data-automation-locator="button.limits"]')
    );
  }

  toggleExtendedHistory(): void {
    this.simulatedClick(
      document.querySelector(
        '[data-automation-locator="button.extenededHistory"]'
      )
    );
  }

  toggleStatistics(): void {
    this.simulatedClick(
      document.querySelector('[data-automation-locator="button.statistic"]')
    );
  }

  toggleStatisticsChart(): void {
    this.simulatedClick(
      document.querySelector(
        '[data-automation-locator="button.StatisticChart"]'
      )
    );
  }
}

export default Playtech;
