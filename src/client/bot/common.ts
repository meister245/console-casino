import { Playtech } from "../driver/playtech";

import { Driver } from "../types";

export class CommonBot {
  running: boolean;
  timeStarted: number;

  constructor() {
    this.running = true;
    this.timeStarted = Math.floor(Date.now() / 1000);
  }

  getDriver(driverName: Driver): Playtech {
    switch (driverName) {
      case "playtech":
        return new Playtech();
      default:
        throw new Error(`invalid driver name ${driverName}`);
    }
  }
}
