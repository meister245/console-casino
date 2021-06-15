import { RouletteConfig } from "../../server/types";
import { RouletteBetManager } from "../betManager/roulette";
import { Playtech } from "../driver/playtech";
import { RESTClient } from "../rest";
import { Driver } from "../types";
import { CommonBot } from "./common";

export class RouletteBot extends CommonBot {
  async start(): Promise<void> {
    const restClient = new RESTClient();

    const { config, strategies } = await restClient.getConfig();

    const driver = this.getDriver(config.driverName as Driver);

    await this.setupTable(driver, restClient, config);

    const betManager = new RouletteBetManager(
      driver,
      restClient,
      config,
      strategies
    );

    betManager.logMessage(config.dryRun ? "DEVELOPMENT" : "PRODUCTION");

    while (this.running) {
      await betManager.start();
      await driver.sleep(1500);
    }
  }

  async setupTable(
    driver: Playtech,
    restClient: RESTClient,
    config: RouletteConfig
  ): Promise<void> {
    while (driver.getLobbyTables().length === 0) {
      await driver.sleep(1500);
    }

    const { tableName } = await restClient.getTableName();

    if (tableName === null) {
      throw Error("no free tables");
    }

    driver.navigateLobbyTable(tableName);

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
