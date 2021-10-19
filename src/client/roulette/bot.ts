import Playtech from "../../driver/playtech";
import { messageRegexInactive, messageRegexInProgress } from "../constants";
import RESTClient, { sleep } from "./rest";
import RouletteTableManager from "./table";

export enum RouletteDriver {
  PLAYTECH = "playtech",
}

let lastLogMessage = "";

const logMessage = (msg: string): void => {
  if (lastLogMessage !== msg) {
    const logMsg = ["console-casino", "bot-manager", msg];
    console.log(logMsg.join(" - "));
    lastLogMessage = msg;
  }
};

const getDriver = (driverName: RouletteDriver): Playtech => {
  switch (driverName) {
    case RouletteDriver.PLAYTECH:
      return new Playtech();
    default:
      throw new Error(`invalid driver name ${driverName}`);
  }
};

class RouletteBot extends RESTClient {
  private running: boolean;

  dryRun: boolean;
  leaseTime: number;
  resetUrl: string;
  tableName: string;

  constructor() {
    super();

    this.running = false;
  }

  async start(driverName: RouletteDriver): Promise<void> {
    if (this.running) {
      throw new Error("already running");
    }

    this.running = true;

    const driver = getDriver(driverName);
    const tableManager = new RouletteTableManager(driver);

    await sleep(5000);
    await this.setupTable(driver, tableManager);

    logMessage(this.dryRun ? "DEVELOPMENT" : "PRODUCTION");

    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = this.leaseTime - currentTime;

    logMessage(`table will be reset in ${timeDiff} seconds`);

    await sleep(3000);

    while (this.running && this.tableName) {
      if (await this.isReloadRequired(tableManager)) {
        await this.reload(tableManager);
      }

      if (tableManager.isActive()) {
        await tableManager.runState();
      }

      await sleep(1500);
    }

    logMessage("terminated process");
  }

  stop(): void {
    this.running = false;
  }

  reset(): void {
    this.dryRun = undefined;
    this.leaseTime = undefined;
    this.resetUrl = undefined;
    this.tableName = undefined;
  }

  async assignTable(): Promise<void> {
    const { success, tableName, resetUrl, dryRun, leaseTime } =
      await this.postTableAssign();

    if (!success) {
      logMessage("network error");
      await sleep(60 * 1000);
    } else if (!tableName) {
      logMessage("no table can be assigned");
      await sleep(60 * 1000 * 5);
    } else {
      this.dryRun = dryRun;
      this.leaseTime = leaseTime;
      this.resetUrl = resetUrl;
      this.tableName = tableName;
    }
  }

  async setupTable(
    driver: Playtech,
    tableManager: RouletteTableManager
  ): Promise<void> {
    while (driver.getLobbyTables().length === 0) {
      logMessage("waiting for lobby tables");
      await sleep(1500);
    }

    while (!this.tableName) {
      await this.assignTable();
    }

    if (!driver.navigateLobbyTable(this.tableName)) {
      logMessage(`table ${this.tableName} not found`);
      await sleep(60 * 1000 * 10);
      await this.reload(tableManager);
    }
  }

  async reload(tableManager: RouletteTableManager): Promise<void> {
    logMessage("table reload initiated");

    try {
      await this.deleteTableRelease({ tableName: this.tableName });
      window.location.href = this.resetUrl;
    } catch {
      logMessage("error while releasing table");
    } finally {
      tableManager.stop();
    }
  }

  async isReloadRequired(tableManager: RouletteTableManager): Promise<boolean> {
    const currentTime = Math.floor(Date.now() / 1000);

    if (!tableManager.isStrategyActive && currentTime > this.leaseTime) {
      logMessage("lease time expired");
      return true;
    }

    for (const msg of tableManager.driver.getMessages()) {
      if (msg && msg.match(messageRegexInactive)) {
        logMessage("table has become inactive");
        return true;
      }

      if (msg && msg.match(messageRegexInProgress)) {
        logMessage("table session interrupted");
        return true;
      }
    }

    return false;
  }
}

export default RouletteBot;
