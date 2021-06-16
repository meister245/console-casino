import { RouletteConfig } from "../../server/types";
import { RouletteBetManager } from "../betManager/roulette";
import { Playtech } from "../driver/playtech";
import { RESTClient } from "../rest";
import { Driver } from "../types";

export class RouletteBot extends RESTClient {
  running: boolean;
  timeStarted: number;

  constructor() {
    super();
    this.running = true;
    this.timeStarted = Math.floor(Date.now() / 1000);
  }

  async start(): Promise<void> {
    const { config, strategies } = await this.getConfig();

    const driver = this.getDriver(config.driverName as Driver);

    await this.setupTable(driver, config);

    const betManager = new RouletteBetManager(driver, config, strategies);

    betManager.logMessage(config.dryRun ? "DEVELOPMENT" : "PRODUCTION");

    while (this.running) {
      await betManager.start();
      await driver.sleep(1500);
    }
  }

  getDriver(driverName: Driver): Playtech {
    switch (driverName) {
      case "playtech":
        return new Playtech();
      default:
        throw new Error(`invalid driver name ${driverName}`);
    }
  }

  async setupTable(driver: Playtech, config: RouletteConfig): Promise<void> {
    while (driver.getLobbyTables().length === 0) {
      await driver.sleep(1500);
    }

    const { tableName } = await this.postTable();

    if (tableName === null) {
      throw Error("no free tables");
    }

    const success = driver.navigateLobbyTable(tableName);

    if (!success) {
      this.deleteTable(tableName);
      await driver.sleep(6000 * 10 * 10);
      window.location.href = config.lobbyUrl;
    }

    while (!driver.getDealerMessage()) {
      await driver.sleep(1500);
    }

    if (!config.dryRun && config.minBalance > driver.getBalance()) {
      throw new Error("balance too low");
    }
  }

  async stop(): Promise<void> {
    this.running = false;
  }
}

new RouletteBot().start();
