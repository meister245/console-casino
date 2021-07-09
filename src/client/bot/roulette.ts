import RouletteBetManager from "../betManager/roulette";
import Playtech from "../driver/playtech";
import RESTClient from "../rest";

enum Driver {
  PLAYTECH = "playtech",
}

class RouletteBot extends RESTClient {
  private running: boolean;

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

    const tableName = await this.setupTable(driver, betManager);

    if (!config.dryRun && config.minBalance > driver.getBalance()) {
      throw new Error("balance too low");
    }

    betManager.logMessage(config.dryRun ? "DEVELOPMENT" : "PRODUCTION");

    while (this.running && tableName) {
      if (await betManager.isReloadRequired()) {
        await betManager.reload(tableName);
      }

      await betManager.runStage();
      await driver.sleep(1500);
    }

    betManager.logMessage("bot process terminated");
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
  ): Promise<string | undefined> {
    while (driver.getLobbyTables().length === 0) {
      await driver.sleep(1500);
    }

    let isTableFound = false;

    while (this.running && !isTableFound) {
      const { success, tableName } = await this.postTableAssign();

      if (!success) {
        betManager.logMessage("network error");
        await driver.sleep(5000);
        continue;
      }

      if (!tableName) {
        betManager.logMessage("no free tables");
        this.stop();
        return;
      }

      isTableFound = driver.navigateLobbyTable(tableName);

      if (!isTableFound) {
        betManager.logMessage(`table ${tableName} offline`);
        await driver.sleep(60 * 10 * 1000);
        await betManager.reload(tableName);
        this.stop();
        return;
      }

      if (await betManager.isReloadRequired()) {
        await driver.sleep(60 * 1000);
        await betManager.reload(tableName);
        this.stop();
        return;
      }

      while (!driver.getDealerMessage) {
        await driver.sleep(1500);
      }

      return tableName;
    }
  }
}

new RouletteBot().start();
