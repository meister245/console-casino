import { DriverCommon } from "./common";

import { DriverSelectors } from "../types";

export class Playtech extends DriverCommon {
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
      },
    };
  }

  getLobbyTables(): NodeListOf<HTMLElement> {
    return document.querySelectorAll(".lobby-table__container");
  }

  navigateLobbyTable(tableName: string): boolean {
    const lobbyTables = this.getLobbyTables();

    for (const table of lobbyTables) {
      const transformedTableName = tableName.replace(/\s/g, "-").toLowerCase();

      let lobbyTableName =
        table.querySelector(".lobby-table__name-container")?.textContent ?? "";

      lobbyTableName = lobbyTableName.replace(/\s/g, "-").toLowerCase();

      if (lobbyTableName === transformedTableName) {
        this.simulatedClick(table);
        return true;
      }
    }

    return false;
  }

  getModalMessage(): string {
    return document.querySelector(".modal-confirm_desktop")?.textContent ?? "";
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
