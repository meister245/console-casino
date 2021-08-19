import fs = require("fs");
import os = require("os");
import path = require("path");

import State from "./server/state";
import Stats, { ServerStats } from "./server/stats";
import {
  RouletteBetConfig,
  RouletteConfig,
  RouletteStrategies,
  ServerGameState,
} from "./types";

const distDir = path.resolve(__dirname, "..", "dist");
const resourcesDir = path.resolve(__dirname, "..", "resources");

const userDataDir = path.resolve(os.homedir(), ".console-casino");
const backtestDir = path.resolve(os.homedir(), ".console-casino-backtest");

const gameBetsPath = path.resolve(userDataDir, "gameBets.log");
const gameStatePath = path.resolve(userDataDir, "gameState.json");
const gameStatsPath = path.resolve(userDataDir, "gameStats.json");

const backtestFileRegex = /^((?:-?[^_\W]+)+)-(\d+)$/;

interface BacktestCollectionState {
  [tableName: string]: number;
}

class Utils {
  backtestCollectionState: BacktestCollectionState;

  constructor() {
    this.backtestCollectionState = this.getBacktestCollectionState();
  }

  getEnv(): string | undefined {
    return process.env?.["NODE_ENV"];
  }

  getConfig(): RouletteConfig {
    const dryRun = this.getEnv() === "dev";
    const filePath = path.resolve(resourcesDir, "config.json");
    const content = fs.readFileSync(filePath, { encoding: "utf8" });
    return { dryRun, ...JSON.parse(content) };
  }

  getStrategies(): RouletteStrategies {
    const strategies = {} as RouletteStrategies;
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

  getBacktestFiles(): string[] {
    const fileNames = [] as string[];

    if (!fs.existsSync(backtestDir)) {
      return fileNames;
    }

    fs.readdirSync(backtestDir).forEach((file) => {
      fileNames.push(path.resolve(backtestDir, file));
    });

    return fileNames;
  }

  getBacktestCollectionState(): BacktestCollectionState {
    const state = {} as BacktestCollectionState;

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

  getClient(): unknown {
    const filePath = path.resolve(distDir, "client.min.js");
    return fs.readFileSync(filePath, { encoding: "utf8" });
  }

  readBacktestFile(filePath: string): number[] {
    const content = fs.readFileSync(filePath, { encoding: "utf8" });

    let numbers = [] as number[];

    for (const row of content.split("\n")) {
      numbers = numbers.concat(row.split(",").map((value) => parseInt(value)));
    }

    return numbers;
  }

  restoreGameState(object: State): void {
    if (fs.existsSync(gameStatePath)) {
      const content = fs.readFileSync(gameStatePath, { encoding: "utf8" });
      const data = JSON.parse(content);
      data && Object.assign(object, data);
    }
  }

  restoreGameStats(object: Stats): void {
    if (fs.existsSync(gameStatsPath)) {
      const content = fs.readFileSync(gameStatsPath, { encoding: "utf8" });
      const data = JSON.parse(content);
      data && Object.assign(object, data);
    }
  }

  writeBacktestFile(tableName: string, numbers: number[]): void {
    const currentTime = Math.floor(Date.now() / 1000);

    this.backtestCollectionState[tableName] = currentTime;

    const fileName = [tableName, currentTime].join("-");
    const filePath = path.resolve(backtestDir, fileName);

    !fs.existsSync(backtestDir) && fs.mkdirSync(backtestDir);

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

  writeGameState(data: ServerGameState): void {
    !fs.existsSync(userDataDir) && fs.mkdirSync(userDataDir);
    fs.writeFileSync(gameStatePath, JSON.stringify(data), {
      encoding: "utf-8",
      flag: "w",
    });
  }

  writeGameStats(data: ServerStats): void {
    !fs.existsSync(userDataDir) && fs.mkdirSync(userDataDir);
    fs.writeFileSync(gameStatsPath, JSON.stringify(data), {
      encoding: "utf-8",
      flag: "w",
    });
  }

  writeGameBet(
    bets: string[],
    size: number,
    strategy: string,
    tableName: string
  ): void {
    !fs.existsSync(userDataDir) && fs.mkdirSync(userDataDir);

    const data = {
      ts: new Date(),
      bets,
      size,
      strategy,
      tableName,
    };

    fs.writeFileSync(gameBetsPath, JSON.stringify(data) + os.EOL, {
      encoding: "utf-8",
      flag: "a",
    });
  }
}

export default Utils;
