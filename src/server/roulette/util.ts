import os = require("os");
import fs = require("fs");
import path = require("path");

import CommonUtils from "../common/util";
import {
  RouletteBacktestCollectionState,
  RouletteBetConfig,
  RouletteConfig,
  RouletteStrategies,
} from "./types";

const backtestFileRegex = /^((?:-?[^_\W]+)+)-(\d+)$/;

export enum RouletteDriver {
  PLAYTECH = "playtech",
}

const clientMapping = {
  playtech: "playtechRoulette.min.js",
};

class RouletteUtils extends CommonUtils {
  backtestState: RouletteBacktestCollectionState;

  constructor() {
    super("roulette");

    this.backtestState = this.getBacktestCollectionState();
  }

  getGameBetsPath(): string {
    const userDataDir = this.getUserDataDir();
    return path.resolve(userDataDir, "gameBets.log");
  }

  getGameStatePath(): string {
    const userDataDir = this.getUserDataDir();
    return path.resolve(userDataDir, "gameState.json");
  }

  getGameStatsPath(): string {
    const userDataDir = this.getUserDataDir();
    return path.resolve(userDataDir, "gameStats.json");
  }

  getGameConfigPath(): string {
    const resourcesDir = this.getResourcesDir();
    return path.resolve(resourcesDir, "config.json");
  }

  getConfig(): RouletteConfig {
    const dryRun = this.getEnv() === "dev";
    const filePath = this.getGameConfigPath();
    const content = fs.readFileSync(filePath, { encoding: "utf8" });
    return { dryRun, ...JSON.parse(content) };
  }

  getStrategies(): RouletteStrategies {
    const strategies = {} as RouletteStrategies;
    const resourcesDir = this.getResourcesDir();
    const strategiesDir = path.resolve(resourcesDir, "strategies");

    fs.readdirSync(strategiesDir).forEach((file) => {
      const filePath = path.resolve(strategiesDir, file);
      const content = fs.readFileSync(filePath, { encoding: "utf8" });
      const data = JSON.parse(content);

      for (const strategyName in data) {
        const strategy = data[strategyName];

        strategy.minBalance = strategy.bets.reduce(
          (acc: number, config: RouletteBetConfig) =>
            acc + config.progression.reduce((a, b) => a + b) * config.betSize,
          0
        );

        strategies[strategyName] = strategy;
      }
    });

    return strategies;
  }

  getClient(clientName: RouletteDriver): unknown {
    const clientFileName = clientMapping[clientName];
    const filePath = path.resolve(this.getDistDir(), "client", clientFileName);
    return fs.readFileSync(filePath, { encoding: "utf8" });
  }

  getBacktestFiles(): string[] {
    const fileNames = [] as string[];
    const backtestDataDir = this.getBacktestDir();

    fs.readdirSync(backtestDataDir).forEach((file) => {
      fileNames.push(path.resolve(backtestDataDir, file));
    });

    return fileNames;
  }

  getBacktestCollectionState(): RouletteBacktestCollectionState {
    const state = {} as RouletteBacktestCollectionState;

    for (const filePath of this.getBacktestFiles()) {
      const fileName = filePath.split("/").pop();
      const match = backtestFileRegex.exec(fileName);

      if (match) {
        const tableName = match[1];
        const fileTimeStamp = parseInt(match[2]);

        if (!Object.keys(state).includes(tableName)) {
          state[tableName] = fileTimeStamp;
        } else if (tableName in state && state[tableName] < fileTimeStamp) {
          state[tableName] = fileTimeStamp;
        }
      }
    }

    return state;
  }

  readBacktestFile(filePath: string): number[] {
    let numbers = [] as number[];

    const content = fs.readFileSync(filePath, { encoding: "utf8" });

    for (const row of content.split("\n")) {
      numbers = numbers.concat(row.split(",").map((value) => parseInt(value)));
    }

    return numbers;
  }

  writeBacktestFile(tableName: string, numbers: number[]): void {
    const currentTime = Math.floor(Date.now() / 1000);

    const backtestDataDir = this.getBacktestDir();
    const fileName = [tableName, currentTime].join("-");
    const filePath = path.resolve(backtestDataDir, fileName);

    this.backtestState[tableName] = currentTime;

    while (numbers.length > 0) {
      const chunk = numbers
        .splice(0, 100)
        .map((value: number) => value.toString())
        .reduce((acc: string, value: string) => `${acc},${value}`);

      fs.writeFileSync(filePath, chunk + "\n", {
        encoding: "utf-8",
        flag: "a",
      });
    }
  }

  readFile(filePath: string): string | undefined {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, { encoding: "utf8" });
      return JSON.parse(content);
    }
  }

  writeFile(filePath: string, data: unknown, flag = "w"): void {
    fs.writeFileSync(filePath, JSON.stringify(data) + os.EOL, {
      encoding: "utf-8",
      flag: flag,
    });
  }
}

export default RouletteUtils;
