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

type BacktestTableResultDetails = {
  totalDays: number;
  averageProfitPerDay: number;
  averageProfitPerWeek: number;
  averageProfitPerMonth: number;
};

type BacktestTableResults = {
  [item: number]: BacktestTableResultDetails;
};

type BacktestResults = {
  tableCount: BacktestTableResults;
};

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

    stats["backtest"] = this.calculateBacktestResults(stats, totalNumbers);

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

  calculateBacktestResults(
    stats: RouletteStats,
    totalNumbers: number
  ): BacktestResults {
    const totalDays =
      (totalNumbers * this.averageSecondsPerGame) / 60 / 60 / 24;

    const calculateTableParallelResult = (days: number) => {
      const totalDaysParallel = totalDays / days;
      const averageProfitPerDayParallel = stats.totalProfit / totalDaysParallel;

      return {
        totalDays: parseFloat(totalDaysParallel.toFixed(1)),
        averageProfitPerDay: parseFloat(averageProfitPerDayParallel.toFixed(2)),
        averageProfitPerWeek: parseFloat(
          (averageProfitPerDayParallel * 7).toFixed(2)
        ),
        averageProfitPerMonth: parseFloat(
          (averageProfitPerDayParallel * 30).toFixed(2)
        ),
      };
    };

    return {
      tableCount: {
        1: calculateTableParallelResult(1),
        6: calculateTableParallelResult(6),
        12: calculateTableParallelResult(12),
        20: calculateTableParallelResult(20),
        30: calculateTableParallelResult(30),
      },
    };
  }
}

export default RouletteBacktest;
