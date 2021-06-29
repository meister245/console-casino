import { RouletteConfig } from "../../server/types";
import { RouletteBetManager } from "../betManager/roulette";
import { Playtech } from "../driver/playtech";
import { RESTClient } from "../rest";
import { Driver } from "../types";

export class RouletteBot extends RESTClient {
  private running: boolean;
  private tableName: string;

  constructor() {
    super();

    this.running = false;
  }

  async start(): Promise<void> {
    if (this.running) {
      throw new Error("already running");
    }

    this.running = true;

    const { config, strategies } = await this.getConfig();

    const driver = this.getDriver(config.driverName as Driver);
    const betManager = new RouletteBetManager(driver, config, strategies);

    await this.setupTable(driver, config, betManager);

    betManager.logMessage(config.dryRun ? "DEVELOPMENT" : "PRODUCTION");

    while (this.running) {
      await betManager.checkBrowserInactivity();

      if (!betManager.validateBetActivity()) {
        await betManager.reload(this.tableName);
      }

      await betManager.runStage();
      await driver.sleep(1500);
    }
  }

  stop(): void {
    this.running = false;
  }

  getDriver(driverName: Driver): Playtech {
    switch (driverName) {
      case "playtech":
        return new Playtech();
      default:
        throw new Error(`invalid driver name ${driverName}`);
    }
  }

  async setupTable(
    driver: Playtech,
    config: RouletteConfig,
    betManager: RouletteBetManager
  ): Promise<void> {
    while (driver.getLobbyTables().length === 0) {
      await driver.sleep(1500);
    }

    const { tableName } = await this.postTableAssign();

    if (!tableName) {
      throw Error("no free tables");
    }

    const isTableFound = driver.navigateLobbyTable(tableName);

    if (tableName && isTableFound) {
      while (!driver.getDealerMessage()) {
        await driver.sleep(1500);
      }

      if (!config.dryRun && config.minBalance > driver.getBalance()) {
        throw new Error("balance too low");
      }
    } else if (tableName && !isTableFound) {
      await driver.sleep(60 * 15 * 1000);
      await betManager.reload(tableName);
    }

    this.tableName = tableName;
  }
}

new RouletteBot().start();
