import { messageRegexInProgress } from "../../constants";
import { RouletteBetManager } from "../betManager/roulette";
import { Playtech } from "../driver/playtech";
import { RESTClient } from "../rest";

enum Driver {
  PLAYTECH = "playtech",
}

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

    const { success, tableName } = await this.postTableAssign();

    if (!success) {
      await driver.sleep(60 * 1000);
      await betManager.reload(tableName);
      throw Error("no free tables");
    }

    const isTableFound = driver.navigateLobbyTable(tableName);

    if (success && !isTableFound) {
      await driver.sleep(60 * 15 * 1000);
      await betManager.reload(tableName);
      throw Error(`table ${tableName} offline`);
    }

    await driver.sleep(1500);

    for (const msg of driver.getMessages()) {
      if (msg.match(messageRegexInProgress)) {
        await driver.sleep(60 * 1000);
        await betManager.reload(tableName);
        throw Error("table session unfinished");
      }
    }

    await driver.sleep(60 * 1000);

    if (success && isTableFound) {
      while (!driver.getDealerMessage()) {
        await driver.sleep(1500);
      }
    }

    this.tableName = tableName;
  }
}

new RouletteBot().start();
