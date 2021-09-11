import Playtech from "../../driver/playtech";
import { messageRegexInactive, messageRegexInProgress } from "../constants";
import RESTClient from "./rest";

enum TableMessage {
  WAIT = "wait for the next round",
  BETS = "place your bets",
  LAST_BETS = "last bets",
  EMPTY = "",
}

enum TableState {
  BET = "stage-bet",
  WAIT = "stage-wait",
  SETUP = "stage-setup",
}

class RouletteTableManager extends RESTClient {
  private running: boolean;
  private driver: Playtech;

  private lastLogMessage: null | string;
  private timeResetDiff: number;
  private timeStarted: number;

  state: TableState;

  constructor(driver: Playtech) {
    super();

    this.driver = driver;
    this.running = true;
    this.state = TableState.SETUP;

    this.lastLogMessage = null;
    this.timeStarted = Math.floor(Date.now() / 1000);
    this.timeResetDiff = 60 * this.getRandomRangeNumber(18, 23);
  }

  isActive(): boolean {
    return this.running;
  }

  setTableState(state: TableState): void {
    this.state = state;
  }

  getRandomRangeNumber = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min)) + min;

  async reload(tableName: string, lobbyUrl: string): Promise<void> {
    this.running = false;
    await this.deleteTableRelease({ tableName });
    window.location.href = lobbyUrl;
  }

  async runState(): Promise<void> {
    if (this.isActive()) {
      this.driver.closeMessages();

      const dealerMessage = this.driver
        .getDealerMessage()
        .toLowerCase() as TableMessage;

      switch (this.state) {
        case TableState.SETUP:
          await this.runStateSetup(dealerMessage);
          break;
        case TableState.WAIT:
          await this.runStateWait(dealerMessage);
          break;
        case TableState.BET:
          await this.runStateBet(dealerMessage);
          break;
      }
    }
  }

  async isReloadRequired(): Promise<boolean> {
    if (!this.state) {
      const timeDiff = Math.floor(Date.now() / 1000) - this.timeStarted;

      if (timeDiff > this.timeResetDiff) {
        return true;
      }
    }

    for (const msg of this.driver.getMessages()) {
      if (msg && msg.match(messageRegexInactive)) {
        this.logMessage("table inactive");
        return true;
      }

      if (msg && msg.match(messageRegexInProgress)) {
        this.logMessage("table session unfinished");
        return true;
      }
    }

    return false;
  }

  async runStateSetup(dealerMessage: TableMessage): Promise<void> {
    this.logMessage("waiting for next spin");

    if (dealerMessage === TableMessage.WAIT) {
      const data = {
        tableName: this.driver.getTableName(),
        chipSize: this.driver.getChipSizes(),
        numbers: this.driver.getNumberHistory(),
      };

      const { success } = await this.postStateSetup(data);

      if (success) {
        this.setTableState(TableState.BET);
      }
    }
  }

  async runStateBet(dealerMessage: TableMessage): Promise<void> {
    this.logMessage("waiting to be able to place bets");

    const expectedMessages = [TableMessage.BETS, TableMessage.LAST_BETS];

    if (expectedMessages.includes(dealerMessage)) {
      const data = {
        balance: this.driver.getBalance(),
        number: this.driver.getLastNumber(),
        tableName: this.driver.getTableName(),
      };

      const { success, bets, clicks, chipSize, strategyName } =
        await this.postStateUpdate(data);

      if (success && bets) {
        this.logMessage(`bet strategy: ${strategyName}`);
        this.submitBets(bets, clicks, chipSize);
      }

      this.setTableState(TableState.WAIT);
    }
  }

  async runStateWait(dealerMessage: TableMessage): Promise<void> {
    this.logMessage("waiting for next round");

    const expectedMessages = [TableMessage.EMPTY, TableMessage.WAIT];

    if (expectedMessages.includes(dealerMessage)) {
      this.setTableState(TableState.BET);
    }
  }

  async submitBets(bets: never, clicks: never, chipSize: never): Promise<void> {
    let totalBetSize = 0;

    for (const betName of Object.keys(bets)) {
      const betChipSize = chipSize[betName];
      const betClicks = clicks[betName];

      this.driver.setChipSize(betChipSize);

      for (let step = 0; step < betClicks; step++) {
        this.driver.setBet(betName);
        totalBetSize += betChipSize;
      }
    }

    if (totalBetSize > 0) {
      await this.postStateBet({
        bets: bets,
        tableName: this.driver.getTableName(),
      });
    }

    this.logMessage(`bets: ${Object.keys(bets).toString()}`);
    this.logMessage(`total: ${totalBetSize.toFixed(2)}`);
  }

  logMessage(msg: string): void {
    const logMessage = ["console-casino", this.state, msg];

    if (logMessage.toString() !== this.lastLogMessage) {
      this.lastLogMessage = logMessage.toString();
      console.log(logMessage.join(" - "));
    }
  }
}

export default RouletteTableManager;
