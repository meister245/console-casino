import Playtech from "../../driver/playtech";
import RouletteTableManager from "./manager";
import RESTClient, { sleep } from "./rest";

export enum RouletteDriver {
  PLAYTECH = "playtech",
}

type TableSetupParams = {
  dryRun: boolean;
  lobbyUrl: string;
  tableName: string;
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

    const { tableName, lobbyUrl, dryRun } = await this.setupTable(
      driver,
      tableManager
    );

    await sleep(3000);

    tableManager.logMessage(dryRun ? "DEVELOPMENT" : "PRODUCTION");

    while (this.running && tableName) {
      if (await tableManager.isReloadRequired()) {
        await tableManager.reload(tableName, lobbyUrl);
      }

      if (driver.getDealerName()) {
        await tableManager.runState();
      }

      await sleep(1500);
    }

    tableManager.logMessage("bot process terminated");
  }

  stop(): void {
    this.running = false;
  }

  async setupTable(
    driver: Playtech,
    tableManager: RouletteTableManager
  ): Promise<TableSetupParams> {
    while (driver.getLobbyTables().length === 0) {
      await sleep(1500);
    }

    let isTableFound = false;

    while (this.running && !isTableFound) {
      const { success, tableName, lobbyUrl, dryRun } =
        await this.postTableAssign();

      if (!success) {
        tableManager.logMessage("network error");
        await sleep(5000);
        continue;
      }

      if (!tableName) {
        tableManager.logMessage("no free tables");
        this.stop();
        return;
      }

      isTableFound = driver.navigateLobbyTable(tableName);

      if (!isTableFound) {
        tableManager.logMessage(`table offline`);
        await sleep(60 * 10 * 1000);
        await tableManager.reload(tableName, lobbyUrl);
        this.stop();
        return;
      }

      if (await tableManager.isReloadRequired()) {
        await sleep(60 * 1000);
        await tableManager.reload(tableName, lobbyUrl);
        this.stop();
        return;
      }

      return { tableName, lobbyUrl, dryRun };
    }
  }
}

export default RouletteBot;
