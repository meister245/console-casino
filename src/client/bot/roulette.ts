import { CommonBot } from "./common";
import { RouletteBetManager } from "../betManager/roulette";

import { Driver } from "./types";

export class RouletteBot extends CommonBot {
  async start(): Promise<void> {
    const { config, strategies } = await this.getConfig();

    const driver = this.getDriver(config.driverName as Driver);

    while (!driver.getDealerMessage()) {
      await driver.sleep(1500);
    }

    if (!config.dryRun && config.minBalance > driver.getBalance()) {
      throw new Error("balance too low");
    }

    const betManager = new RouletteBetManager(driver, config, strategies);

    betManager.logMessage(config.dryRun ? "DEVELOPMENT" : "PRODUCTION");

    while (this.running) {
      await betManager.start();
      await driver.sleep(1500);
    }
  }

  async stop(): Promise<void> {
    this.running = false;
  }
}

new RouletteBot().start();
