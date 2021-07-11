import { GameResult } from "./../types";

export type ServerStats = {
  totalProfit: number;
  totalGames: number;
  tableStats: TableStats;
  strategyStats: StrategyStats;
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
  totalProfit: number;
  totalGames: number;
  tableStats: TableStats;
  strategyStats: StrategyStats;

  constructor() {
    this.totalProfit = 0;
    this.totalGames = 0;
    this.tableStats = {};
    this.strategyStats = {};
  }

  getServerStats(): ServerStats {
    return {
      totalProfit: this.totalProfit,
      totalGames: this.totalGames,
      tableStats: this.sortObject(this.tableStats) as TableStats,
      strategyStats: this.sortObject(this.strategyStats) as StrategyStats,
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

    this.updateGameStats(result, tableName);
    this.updateStrategyStats(strategy, profit, progression);
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
    strategy: string,
    profit: number,
    progression: number
  ): void {
    if (!(strategy in this.strategyStats)) {
      this.strategyStats[strategy] = {
        count: 0,
        percent: 0,
        profit: 0,
        progression: {},
      };
    }

    this.strategyStats[strategy].count += 1;
    this.strategyStats[strategy].profit += profit;

    this.strategyStats[strategy].profit = parseFloat(
      this.strategyStats[strategy].profit.toFixed(2)
    );

    if (!(progression in this.strategyStats[strategy].progression)) {
      this.strategyStats[strategy].progression[progression] = {
        count: 0,
        profit: 0,
        percent: 0,
      };
    }

    this.strategyStats[strategy].progression[progression].count += 1;
    this.strategyStats[strategy].progression[progression].profit += profit;

    this.strategyStats[strategy].progression[progression].profit = parseFloat(
      this.strategyStats[strategy].progression[progression].profit.toFixed(2)
    );

    Object.keys(this.strategyStats).forEach((strategyKey) => {
      const item = this.strategyStats[strategyKey];
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
