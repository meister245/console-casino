import { RouletteConfig } from "../../server/types";
import { RouletteBetManager } from "../betManager/roulette";
import { Playtech } from "../driver/playtech";
import { RESTClient } from "../rest";
import { Driver } from "../types";

export class RouletteBot extends RESTClient {
  running: boolean;
  tableName: string;

  constructor() {
    super();

    this.running = true;
  }

  async start(): Promise<void> {
    const { config, strategies } = await this.getConfig();

    const driver = this.getDriver(config.driverName as Driver);

    await this.setupTable(driver, config);

    if (this.running) {
      const betManager = new RouletteBetManager(driver, config, strategies);

      betManager.logMessage(config.dryRun ? "DEVELOPMENT" : "PRODUCTION");

      while (this.running) {
        await betManager.start();
        await driver.sleep(1500);

        if (!betManager.state.gameState) {
          const timeDiff =
            Math.floor(Date.now() / 1000) - betManager.lastBetTime;

          if (timeDiff > 60 * 20) {
            this.stop();
            this.deleteTable(this.tableName);
            window.location.href = config.lobbyUrl;
          }
        }
      }
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
      this.stop();
      this.deleteTable(tableName);

      await driver.sleep(6000 * 10 * 10);
      window.location.href = config.lobbyUrl;
      return;
    }

    this.tableName = tableName;

    while (!driver.getDealerMessage()) {
      await driver.sleep(1500);
    }

    if (!config.dryRun && config.minBalance > driver.getBalance()) {
      throw new Error("balance too low");
    }
  }

  stop(): void {
    this.running = false;
  }
}

new RouletteBot().start();
