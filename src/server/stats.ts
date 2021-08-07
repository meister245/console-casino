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

interface TableStats {
  [result: string]: {
    gamesWin: number;
    gamesLose: number;
    gamesNull: number;
    gamesAbort: number;
  };
}

interface StrategyStats {
  [strategy: string]: {
    count: number;
    profit: number;
    percent: number;
    progression: ProgressionStats;
  };
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
    strategy: string,
    profit: number,
    progression: number,
    tableName: string
  ): void {
    this.totalGames += 1;
    this.totalProfit += profit;
    this.totalProfit = parseFloat(this.totalProfit.toFixed(2));

    const strategyGroup = strategies[strategy]?.group ?? "unspecified";

    this.updateGameStats(result, tableName);
    this.updateStrategyStats(this.strategyStats, strategy, profit, progression);

    this.updateStrategyStats(
      this.strategyGroupStats,
      strategyGroup,
      profit,
      progression
    );
  }

  updateGameStats(result: GameResult, tableName: string): void {
    if (!(tableName in this.tableStats)) {
      this.tableStats[tableName] = {
        gamesWin: 0,
        gamesLose: 0,
        gamesAbort: 0,
        gamesNull: 0,
      };
    }

    const tableResultStats = this.tableStats[tableName];

    switch (result) {
      case GameResult.WIN:
        tableResultStats.gamesWin += 1;
        break;
      case GameResult.LOSE:
        tableResultStats.gamesLose += 1;
        break;
      case GameResult.ABORT:
        tableResultStats.gamesAbort += 1;
        break;
      case GameResult.NULL:
        tableResultStats.gamesNull += 1;
        break;
    }
  }

  updateStrategyStats(
    stats: StrategyStats,
    strategy: string,
    profit: number,
    progression: number
  ): void {
    if (!(strategy in stats)) {
      stats[strategy] = {
        count: 0,
        percent: 0,
        profit: 0,
        progression: {},
      };
    }

    stats[strategy].count += 1;
    stats[strategy].profit += profit;
    stats[strategy].profit = parseFloat(stats[strategy].profit.toFixed(2));

    if (!(progression in stats[strategy].progression)) {
      stats[strategy].progression[progression] = {
        count: 0,
        profit: 0,
        percent: 0,
      };
    }

    stats[strategy].progression[progression].count += 1;
    stats[strategy].progression[progression].profit += profit;

    stats[strategy].progression[progression].profit = parseFloat(
      stats[strategy].progression[progression].profit.toFixed(2)
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
