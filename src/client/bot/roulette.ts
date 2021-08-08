import RouletteBetManager, { sleep } from "../betManager/roulette";
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

    const tableRegex = await this.setupTable(driver, betManager);

    betManager.logMessage(config.dryRun ? "DEVELOPMENT" : "PRODUCTION");

    while (this.running && tableRegex) {
      if (await betManager.isReloadRequired()) {
        await betManager.reload(tableRegex);
      }

      if (driver.getDealerName()) {
        await betManager.runStage();
      }

      await sleep(1500);
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
      await sleep(1500);
    }

    let isTableFound = false;

    while (this.running && !isTableFound) {
      const { success, tableRegex } = await this.postTableAssign();

      if (!success) {
        betManager.logMessage("network error");
        await sleep(5000);
        continue;
      }

      if (!tableRegex) {
        betManager.logMessage("no free tables");
        this.stop();
        return;
      }

      isTableFound = driver.navigateLobbyTable(tableRegex);

      if (!isTableFound) {
        betManager.logMessage(`table offline`);
        await sleep(60 * 10 * 1000);
        await betManager.reload(tableRegex);
        this.stop();
        return;
      }

      if (await betManager.isReloadRequired()) {
        await sleep(60 * 1000);
        await betManager.reload(tableRegex);
        this.stop();
        return;
      }

      return tableRegex;
    }
  }
}

new RouletteBot().start();
