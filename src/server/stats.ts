import { GameResult } from "./types";

type ServerStats = {
  totalGames: number;
  tableStats: TableStats;
  multiplierStats: MultiplierStats;
  strategyMultiplierStats: StrategyMultiplierStats;
};

interface TableStats {
  [result: string]: {
    gamesWin: number;
    gamesLose: number;
    gamesAbort: number;
  };
}
interface MultiplierStats {
  [multiplier: string]: {
    count: number;
    percent: number;
  };
}

interface StrategyMultiplierStats {
  [strategy: string]: {
    count: number;
    percent: number;
    multiplier: MultiplierStats;
  };
}

class Stats {
  private totalGames: number;
  private tableStats: TableStats;
  private multiplierStats: MultiplierStats;
  private strategyMultiplierStats: StrategyMultiplierStats;

  constructor() {
    this.totalGames = 0;
    this.tableStats = {};
    this.multiplierStats = {};
    this.strategyMultiplierStats = {};
  }

  getServerStats(): ServerStats {
    return {
      totalGames: this.totalGames,
      tableStats: this.tableStats,
      multiplierStats: this.multiplierStats,
      strategyMultiplierStats: this.strategyMultiplierStats,
    };
  }

  updateStats(
    result: GameResult,
    strategy: string,
    multiplier: number,
    tableName: string
  ): void {
    this.totalGames += 1;
    this.updateGameStats(result, tableName);
    this.updateMultiplierStats(multiplier);
    this.updateStrategyMultiplierStats(strategy, multiplier);
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

  updateMultiplierStats(multiplier: number): void {
    if (!(multiplier in this.multiplierStats)) {
      this.multiplierStats[multiplier] = { count: 0, percent: 0 };
    }

    this.multiplierStats[multiplier].count += 1;

    Object.keys(this.multiplierStats).forEach((key) => {
      this.multiplierStats[key].percent = Math.floor(
        (this.multiplierStats[key].count / this.totalGames) * 100
      );
    });
  }

  updateStrategyMultiplierStats(strategy: string, multiplier: number): void {
    if (!(strategy in this.strategyMultiplierStats)) {
      this.strategyMultiplierStats[strategy] = {
        count: 0,
        percent: 0,
        multiplier: {},
      };
    }

    this.strategyMultiplierStats[strategy].count += 1;

    if (!(multiplier in this.strategyMultiplierStats[strategy].multiplier)) {
      this.strategyMultiplierStats[strategy].multiplier[multiplier] = {
        count: 0,
        percent: 0,
      };
    }

    this.strategyMultiplierStats[strategy].multiplier[multiplier].count += 1;

    Object.keys(this.strategyMultiplierStats).forEach((strategyKey) => {
      const item = this.strategyMultiplierStats[strategyKey];
      item.percent = Math.floor((item.count / this.totalGames) * 100);

      Object.keys(item.multiplier).forEach((multiplierKey) => {
        const multiplierItem = item.multiplier[multiplierKey];
        multiplierItem.percent = Math.floor(
          (multiplierItem.count / this.totalGames) * 100
        );
      });
    });
  }
}

export default Stats;
