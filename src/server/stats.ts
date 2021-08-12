import { GameResult } from "./../types";
import { strategies } from "./app";

export type ServerStats = {
  dateStarted: Date;
  totalProfit: number;
  totalGames: number;
  tableStats: TableStats;
  strategyStats: StrategyStats;
  strategyGroupStats: StrategyStats;
};

interface GameResults {
  gamesWin: number;
  gamesLose: number;
  gamesNull: number;
  gamesAbort: number;
}

interface TableStats {
  [entry: string]: GameResults;
}

interface StrategyDetails {
  count: number;
  profit: number;
  percent: number;
  results: GameResults;
  progression: ProgressionStats;
}

interface StrategyStats {
  [strategy: string]: StrategyDetails;
}

interface ProgressionStats {
  [progression: string]: {
    count: number;
    profit: number;
    percent: number;
  };
}

class Stats implements ServerStats {
  dateStarted: Date;
  totalProfit: number;
  totalGames: number;
  tableStats: TableStats;
  strategyStats: StrategyStats;
  strategyGroupStats: StrategyStats;

  constructor() {
    this.dateStarted = new Date();
    this.totalProfit = 0;
    this.totalGames = 0;

    this.tableStats = {};
    this.strategyStats = {};
    this.strategyGroupStats = {};
  }

  getServerStats(): ServerStats {
    return {
      dateStarted: this.dateStarted,
      totalProfit: this.totalProfit,
      totalGames: this.totalGames,
      tableStats: this.sortObject(this.tableStats) as TableStats,
      strategyStats: this.sortObject(this.strategyStats) as StrategyStats,
      strategyGroupStats: this.sortObject(
        this.strategyGroupStats
      ) as StrategyStats,
    };
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  sortObject(stats: object): object {
    return Object.keys(stats)
      .sort()
      .reduce((result: never, key) => {
        result[key] = stats[key as never] as never;
        return result;
      }, {});
  }

  updateStats(
    result: GameResult,
    strategyName: string,
    profit: number,
    progression: number,
    tableName: string
  ): void {
    this.totalGames += 1;
    this.totalProfit += profit;
    this.totalProfit = parseFloat(this.totalProfit.toFixed(2));

    const strategyGroupName = strategies[strategyName]?.group ?? "unspecified";

    this.updateTableStats(result, tableName);

    this.updateStrategyStats(
      this.strategyStats,
      strategyName,
      profit,
      progression,
      result
    );

    this.updateStrategyStats(
      this.strategyGroupStats,
      strategyGroupName,
      profit,
      progression,
      result
    );
  }

  updateTableStats(result: GameResult, tableName: string): void {
    if (!(tableName in this.tableStats)) {
      this.tableStats[tableName] = {
        gamesWin: 0,
        gamesLose: 0,
        gamesAbort: 0,
        gamesNull: 0,
      };
    }

    this.updateGameResult(this.tableStats[tableName], result);
  }

  updateGameResult(results: GameResults, result: GameResult): void {
    switch (result) {
      case GameResult.WIN:
        results.gamesWin += 1;
        break;
      case GameResult.LOSE:
        results.gamesLose += 1;
        break;
      case GameResult.ABORT:
        results.gamesAbort += 1;
        break;
      case GameResult.NULL:
        results.gamesNull += 1;
        break;
    }
  }

  updateStrategyStats(
    stats: StrategyStats,
    strategyName: string,
    profit: number,
    progression: number,
    result: GameResult
  ): void {
    if (!(strategyName in stats)) {
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

    const strategy = stats[strategyName];

    strategy.count += 1;
    strategy.profit += profit;
    strategy.profit = parseFloat(strategy.profit.toFixed(2));

    this.updateGameResult(strategy.results, result);

    if (!(progression in strategy.progression)) {
      strategy.progression[progression] = {
        count: 0,
        profit: 0,
        percent: 0,
      };
    }

    strategy.progression[progression].count += 1;
    strategy.progression[progression].profit += profit;

    strategy.progression[progression].profit = parseFloat(
      strategy.progression[progression].profit.toFixed(2)
    );

    Object.keys(stats).forEach((strategyKey) => {
      const item = stats[strategyKey];
      item.percent = Math.floor((item.count / this.totalGames) * 100);

      Object.keys(item.progression).forEach((progressionKey) => {
        const progressionItem = item.progression[progressionKey];
        progressionItem.percent = Math.floor(
          (progressionItem.count / this.totalGames) * 100
        );
      });
    });
  }
}

export default Stats;
