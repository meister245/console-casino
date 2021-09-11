import { utils } from "./app";
import { RouletteGameResult } from "./enums";
import {
  RouletteGameResultCounter,
  RouletteGameState,
  RouletteStrategyStats,
  RouletteStrategyStatsDetails,
  RouletteTableStats,
} from "./types";

const sortObject = (stats: unknown): unknown => {
  return Object.keys(stats)
    .sort()
    .reduce((result: never, key) => {
      result[key] = stats[key as never] as never;
      return result;
    }, {});
};

export interface RouletteStatsProps {
  dateStarted: Date;
  totalProfit: number;
  totalGames: number;
  tableStats: RouletteTableStats;
  strategyStats: RouletteStrategyStats;
  strategyGroupStats: RouletteStrategyStats;
}

class RouletteStats implements RouletteStatsProps {
  dateStarted: Date;
  totalProfit: number;
  totalGames: number;
  tableStats: RouletteTableStats;
  strategyStats: RouletteStrategyStats;
  strategyGroupStats: RouletteStrategyStats;

  constructor() {
    this.dateStarted = new Date();
    this.totalProfit = 0;
    this.totalGames = 0;

    this.tableStats = {};
    this.strategyStats = {};
    this.strategyGroupStats = {};
  }

  getStats(): RouletteStatsProps {
    return {
      dateStarted: this.dateStarted,
      totalProfit: this.totalProfit,
      totalGames: this.totalGames,
      tableStats: sortObject(this.tableStats) as RouletteTableStats,
      strategyStats: sortObject(this.strategyStats) as RouletteStrategyStats,
      strategyGroupStats: sortObject(
        this.strategyGroupStats
      ) as RouletteStrategyStats,
    };
  }

  writeStats(): void {
    const data = this.getStats();
    const gameStatsPath = utils.getGameStatsPath();
    utils.writeFile(gameStatsPath, JSON.stringify(data));
  }

  restoreStats(): void {
    const gameStatsPath = utils.getGameStatsPath();
    const data = utils.readFile(gameStatsPath);
    data && Object.assign(this, data);
  }

  updateStats(
    result: RouletteGameResult,
    tableName: string,
    gameState: RouletteGameState
  ): void {
    this.totalGames += 1;

    this.totalProfit += gameState?.profit ?? 0;
    this.totalProfit = parseFloat(this.totalProfit.toFixed(2));

    this.updateTableStats(result, tableName);

    this.updateStrategyStats(
      this.strategyStats,
      gameState.strategyName,
      gameState.profit,
      gameState.betProgression,
      result
    );

    const strategyGroupName = gameState.betStrategy?.group ?? "unspecified";

    this.updateStrategyStats(
      this.strategyGroupStats,
      strategyGroupName,
      gameState.profit,
      gameState.betProgression,
      result
    );

    this.writeStats();
  }

  setupTableStats(tableName: string): void {
    this.tableStats[tableName] = {
      gamesWin: 0,
      gamesLose: 0,
      gamesAbort: 0,
      gamesNull: 0,
    };
  }

  updateTableStats(result: RouletteGameResult, tableName: string): void {
    if (!(tableName in this.tableStats)) {
      this.setupTableStats(tableName);
    }

    this.updateGameResult(this.tableStats[tableName], result);
  }

  updateGameResult(
    results: RouletteGameResultCounter,
    result: RouletteGameResult
  ): void {
    switch (result) {
      case RouletteGameResult.WIN:
        results.gamesWin += 1;
        break;
      case RouletteGameResult.LOSE:
        results.gamesLose += 1;
        break;
      case RouletteGameResult.ABORT:
        results.gamesAbort += 1;
        break;
      case RouletteGameResult.NULL:
        results.gamesNull += 1;
        break;
    }
  }

  setupStrategyStats(stats: RouletteStrategyStats, strategyName: string): void {
    stats[strategyName] = {
      count: 0,
      percent: 0,
      profit: 0,
      progression: {},
      results: {
        gamesWin: 0,
        gamesLose: 0,
        gamesAbort: 0,
        gamesNull: 0,
      },
    };
  }

  setupProgression(
    strategy: RouletteStrategyStatsDetails,
    progression: number
  ): void {
    strategy.progression[progression] = {
      count: 0,
      profit: 0,
      percent: 0,
    };
  }

  recalculateStats(stats: RouletteStrategyStats): void {
    Object.values(stats).forEach((strategy) => {
      strategy.percent = Math.floor((strategy.count / this.totalGames) * 100);

      Object.values(strategy.progression).forEach((progression) => {
        progression.percent = Math.floor(
          (progression.count / this.totalGames) * 100
        );
      });
    });
  }

  updateStrategyStats(
    stats: RouletteStrategyStats,
    strategyName: string,
    profit: number,
    progression: number,
    result: RouletteGameResult
  ): void {
    if (!(strategyName in stats)) {
      this.setupStrategyStats(stats, strategyName);
    }

    const strategy = stats[strategyName];

    strategy.count += 1;
    strategy.profit += profit;
    strategy.profit = parseFloat(strategy.profit.toFixed(2));

    this.updateGameResult(strategy.results, result);

    if (!(progression in strategy.progression)) {
      this.setupProgression(strategy, progression);
    }

    strategy.progression[progression].count += 1;
    strategy.progression[progression].profit += profit;

    strategy.progression[progression].profit = parseFloat(
      strategy.progression[progression].profit.toFixed(2)
    );

    this.recalculateStats(stats);
  }
}

export default RouletteStats;
