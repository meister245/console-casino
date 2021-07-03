import { GameResult } from "./../types";

export type ServerStats = {
  totalGames: number;
  tableStats: TableStats;
  strategyStats: StrategyStats;
};

interface TableStats {
  [result: string]: {
    gamesWin: number;
    gamesLose: number;
    gamesAbort: number;
  };
}

interface StrategyStats {
  [strategy: string]: {
    count: number;
    percent: number;
    progression: ProgressionStats;
  };
}

interface ProgressionStats {
  [progression: string]: {
    count: number;
    percent: number;
  };
}

class Stats implements ServerStats {
  totalGames: number;
  tableStats: TableStats;
  strategyStats: StrategyStats;

  constructor() {
    this.totalGames = 0;
    this.tableStats = {};
    this.strategyStats = {};
  }

  getServerStats(): ServerStats {
    return {
      totalGames: this.totalGames,
      tableStats: this.tableStats,
      strategyStats: this.strategyStats,
    };
  }

  updateStats(
    result: GameResult,
    strategy: string,
    progression: number,
    tableName: string
  ): void {
    this.totalGames += 1;
    this.updateGameStats(result, tableName);
    this.updateStrategyStats(strategy, progression);
  }

  updateGameStats(result: GameResult, tableName: string): void {
    if (!(tableName in this.tableStats)) {
      this.tableStats[tableName] = { gamesWin: 0, gamesLose: 0, gamesAbort: 0 };
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
    }
  }

  updateStrategyStats(strategy: string, progression: number): void {
    if (!(strategy in this.strategyStats)) {
      this.strategyStats[strategy] = {
        count: 0,
        percent: 0,
        progression: {},
      };
    }

    this.strategyStats[strategy].count += 1;

    if (!(progression in this.strategyStats[strategy].progression)) {
      this.strategyStats[strategy].progression[progression] = {
        count: 0,
        percent: 0,
      };
    }

    this.strategyStats[strategy].progression[progression].count += 1;

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
