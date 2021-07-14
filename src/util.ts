import fs = require("fs");
import os = require("os");
import path = require("path");

import State from "./server/state";
import Stats, { ServerStats } from "./server/stats";
import { RouletteConfig, RouletteStrategies, ServerGameState } from "./types";

const distDir = path.resolve(__dirname, "..", "dist");
const userDataDir = path.resolve(os.homedir(), ".console-casino");
const resourcesDir = path.resolve(__dirname, "..", "resources");

const gameBetsPath = path.resolve(userDataDir, "gameBets.log");
const gameStatePath = path.resolve(userDataDir, "gameState.json");
const gameStatsPath = path.resolve(userDataDir, "gameStats.json");

class Utils {
  getConfig(): RouletteConfig {
    const filePath = path.resolve(resourcesDir, "config.json");
    const content = fs.readFileSync(filePath, { encoding: "utf8" });
    return JSON.parse(content);
  }

  getStrategies(): RouletteStrategies {
    const strategies = {} as RouletteStrategies;
    const strategiesDir = path.resolve(resourcesDir, "strategies");

    fs.readdirSync(strategiesDir).forEach((file) => {
      const filePath = path.resolve(strategiesDir, file);
      const content = fs.readFileSync(filePath, { encoding: "utf8" });
      Object.assign(strategies, JSON.parse(content));
    });

    return strategies;
  }

  getClient(): unknown {
    const filePath = path.resolve(distDir, "client.min.js");
    return fs.readFileSync(filePath, { encoding: "utf8" });
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
