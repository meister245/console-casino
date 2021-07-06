import { messageRegexInProgress } from "../../constants";
import { RouletteBetManager } from "../betManager/roulette";
import { Playtech } from "../driver/playtech";
import { RESTClient } from "../rest";

enum Driver {
  PLAYTECH = "playtech",
}

export class RouletteBot extends RESTClient {
  private running: boolean;
  private tableName: string | undefined;

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

    await this.setupTable(driver, betManager);

    if (!config.dryRun && config.minBalance > driver.getBalance()) {
      throw new Error("balance too low");
    }

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
    betManager: RouletteBetManager
  ): Promise<void> {
    while (driver.getLobbyTables().length === 0) {
      await driver.sleep(1500);
    }

    let isTableFound = false;

    while (!isTableFound) {
      const { success, tableName } = await this.postTableAssign();

      if (!success) {
        betManager.logMessage("network error");
        await driver.sleep(2500);
        continue;
      }

      if (!tableName) {
        betManager.logMessage("no free tables");
        await driver.sleep(2500);
        throw new Error("no free tables");
      }

      isTableFound = driver.navigateLobbyTable(tableName);

      if (tableName && !isTableFound) {
        betManager.logMessage(`table ${tableName} offline`);
        await driver.sleep(60 * 10 * 1000);
        await betManager.reload(tableName);
        throw new Error(`table ${tableName} offline`);
      }

      for (const msg of driver.getMessages()) {
        if (msg.match(messageRegexInProgress)) {
          betManager.logMessage(`table ${tableName} session unfinished`);
          await driver.sleep(60 * 1000);
          await betManager.reload(tableName);
          throw new Error(`table ${tableName} session unfinished`);
        }
      }

      if (tableName) {
        this.tableName = tableName;
      }
    }

    while (!this.tableName || !driver.getDealerMessage) {
      await driver.sleep(1500);
    }
  }
}

new RouletteBot().start();
