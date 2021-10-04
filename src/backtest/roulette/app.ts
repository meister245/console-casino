import path = require("path");

import { consoleLogger as logger } from "../../server/common/logger";
import RouletteTableState from "../../server/roulette/state";
import RouletteStats from "../../server/roulette/stats";
import Utils from "../../server/roulette/util";

const utils = new Utils();

function* getBacktestNumbers() {
  for (const filePath of utils.getBacktestFiles()) {
    yield { filePath, numbers: utils.readBacktestFile(filePath) };
  }
}

class RouletteBacktest {
  balance: number;
  chipSize: number[];
  numberOfTables: number;
  averageSecondsPerGame: number;

  constructor() {
    this.balance = 999999;
    this.chipSize = [0.1, 0.2, 0.25, 0.5, 1.0, 2.0];
    this.numberOfTables = 6;
    this.averageSecondsPerGame = 38;
  }

  async run(): Promise<void> {
    let totalNumbers = 0;

    const stats = new RouletteStats();

    for (const { numbers, filePath } of getBacktestNumbers()) {
      totalNumbers += numbers.length;

      logger.info(filePath);

      const tableName = filePath.split("/").pop();
      await this.backtestProcess(stats, numbers, tableName);
    }

    this.logResults(stats, totalNumbers);

    const fileName = ["backtest", Math.floor(Date.now() / 1000)].join("-");

    const resultDir = utils.getBacktestResultDir();
    const resultPath = path.resolve(resultDir, fileName + ".json");

    utils.writeFile(resultPath, stats);
  }

  async backtestProcess(
    stats: RouletteStats,
    numbers: number[],
    tableName: string
  ): Promise<void> {
    const state = new RouletteTableState(tableName, [], this.chipSize);

    for (const number of numbers) {
      const actions = state.processNumber(stats, number, this.balance);

      if (actions.bets) {
        const totalSize = state.getBetTotalSize();
        totalSize > 0 && state.processBet(actions.bets);
      }
    }
  }

  logResults(stats: RouletteStats, totalNumbers: number): void {
    const totalSeconds = totalNumbers * this.averageSecondsPerGame;

    const totalDays = totalSeconds / 60 / 60 / 24;
    const totalDaysParallel = totalDays / this.numberOfTables;

    const averageProfitPerDay = stats.totalProfit / totalDays;
    const averageProfitPerDayParallel = stats.totalProfit / totalDaysParallel;

    const averageGamesPerDay = stats.totalGames / totalDays;
    const averageGamesPerDayParallel = stats.totalGames / totalDaysParallel;

    logger.info(`=== total ===`);
    logger.info(`total games - ${stats.totalGames}`);
    logger.info(`total profit - ${stats.totalProfit}`);
    logger.info(`total number of days - 1 table - ${totalDays.toFixed(1)}`);
    logger.info(
      `total number of days - 6 table - ${totalDaysParallel.toFixed(1)}`
    );

    logger.info(`=== average games ===`);
    logger.info(`per day - 1 table - ${averageGamesPerDay.toFixed(2)}`);
    logger.info(
      `per day - ${
        this.numberOfTables
      } table - ${averageGamesPerDayParallel.toFixed(2)}`
    );

    logger.info(`=== average profit ===`);
    logger.info(`per day - 1 table - ${averageProfitPerDay.toFixed(2)}`);
    logger.info(`per week - 1 table - ${(averageProfitPerDay * 7).toFixed(2)}`);
    logger.info(
      `per month - 1 table - ${(averageProfitPerDay * 30).toFixed(2)}`
    );

    logger.info(
      `per day - ${
        this.numberOfTables
      } tables - ${averageProfitPerDayParallel.toFixed(2)}`
    );
    logger.info(
      `per week - ${this.numberOfTables} tables - ${(
        averageProfitPerDayParallel * 7
      ).toFixed(2)}`
    );
    logger.info(
      `per month - ${this.numberOfTables} tables - ${(
        averageProfitPerDayParallel * 30
      ).toFixed(2)}`
    );
  }
}

export default RouletteBacktest;
