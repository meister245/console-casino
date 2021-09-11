import os = require("os");
import fs = require("fs");
import path = require("path");

const distDir = path.resolve(__dirname, "..", "..", "..", "dist");
const resourcesDir = path.resolve(__dirname, "..", "..", "..", "resources");

const userDataDir = path.resolve(os.homedir(), ".console-casino");
const backtestDataDir = path.resolve(os.homedir(), ".console-casino-backtest");
const backtestResultDir = path.resolve(backtestDataDir, "results");

const setupDir = (dirPath: string): string => {
  !fs.existsSync(dirPath) && fs.mkdirSync(dirPath);
  return dirPath;
};

setupDir(userDataDir);
setupDir(backtestDataDir);
setupDir(backtestResultDir);

class CommonUtils {
  private game: string;

  constructor(name: string) {
    this.game = name;
  }

  getEnv(): string | undefined {
    return process.env?.["NODE_ENV"];
  }

  getDistDir(): string {
    return setupDir(distDir);
  }

  getResourcesDir(): string {
    const dirPath = path.resolve(resourcesDir, this.game);
    return setupDir(dirPath);
  }

  getUserDataDir(): string {
    const dirPath = path.resolve(userDataDir, this.game);
    return setupDir(dirPath);
  }

  getBacktestDir(): string {
    const dirPath = path.resolve(backtestDataDir, this.game);
    return setupDir(dirPath);
  }

  getBacktestResultDir(): string {
    const dirPath = path.resolve(backtestResultDir, this.game);
    return setupDir(dirPath);
  }
}

export default CommonUtils;
