import Playtech from "../../driver/playtech";
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

let lastLogMessage = "";

const logMessage = (msg: string): void => {
  if (lastLogMessage !== msg) {
    const logMessage = ["console-casino", "table-manager", msg];
    console.log(logMessage.join(" - "));
    lastLogMessage = msg;
  }
};

class RouletteTableManager extends RESTClient {
  private running: boolean;

  isStrategyActive: boolean;
  isLeaseExtension: boolean;

  leaseTime: number;
  driver: Playtech;
  state: TableState;

  constructor(driver: Playtech) {
    super();

    this.running = true;

    this.isStrategyActive = false;
    this.isLeaseExtension = false;

    this.leaseTime = 0;
    this.driver = driver;
    this.state = TableState.SETUP;
  }

  toggleExtension(): void {
    this.isLeaseExtension = !this.isLeaseExtension;
  }

  isActive(): boolean {
    return this.running;
  }

  stop(): void {
    this.running = false;
    logMessage("terminated process");
  }

  setTableState(state: TableState): void {
    this.state = state;
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

  async runStateSetup(dealerMessage: TableMessage): Promise<void> {
    logMessage("waiting for next spin");

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
    logMessage("waiting to be able to place bets");

    const expectedMessages = [TableMessage.BETS, TableMessage.LAST_BETS];

    if (expectedMessages.includes(dealerMessage)) {
      const data = {
        balance: this.driver.getBalance(),
        number: this.driver.getLastNumber(),
        tableName: this.driver.getTableName(),
      };

      const { success, bets, clicks, chipSize, strategyName } =
        await this.postStateUpdate(data);

      this.isStrategyActive = bets ? true : false;

      if (success && bets) {
        logMessage(`bet strategy: ${strategyName}`);
        this.submitBets(bets, clicks, chipSize);
      }

      this.setTableState(TableState.WAIT);
    }
  }

  async runStateWait(dealerMessage: TableMessage): Promise<void> {
    logMessage("waiting for next round");

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

      this.toggleExtension();
    }

    logMessage(`bets: ${Object.keys(bets).toString()}`);
    logMessage(`total: ${totalBetSize.toFixed(2)}`);
  }
}

export default RouletteTableManager;
