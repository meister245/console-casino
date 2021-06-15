import {
  GameResult,
  GameStats,
  MultiplierStats,
  StrategyMultiplierStats,
  TableStats,
} from "./types";

let totalGames = 0;

const tableStats: TableStats = {};
const multiplierStats: MultiplierStats = {};
const strategyMultiplierStats: StrategyMultiplierStats = {};

export const getStats = (): GameStats => {
  return {
    totalGames,
    tableStats,
    multiplierStats,
    strategyMultiplierStats,
  };
};

export const updateStats = (
  result: GameResult,
  strategy: string,
  multiplier: number,
  tableName: string
): void => {
  totalGames += 1;
  updateGameStats(result, tableName);
  updateMultiplierStats(multiplier);
  updateStrategyMultiplierStats(strategy, multiplier);
};

const updateGameStats = (result: GameResult, tableName: string): void => {
  if (!(tableName in tableStats)) {
    tableStats[tableName] = { gamesWin: 0, gamesLose: 0, gamesAbort: 0 };
  }

  const tableResultStats = tableStats[tableName];

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
};

const updateMultiplierStats = (multiplier: number) => {
  if (!(multiplier in multiplierStats)) {
    multiplierStats[multiplier] = { count: 0, percent: 0 };
  }

  multiplierStats[multiplier].count += 1;

  Object.keys(multiplierStats).forEach((key) => {
    multiplierStats[key].percent = Math.floor(
      (multiplierStats[key].count / totalGames) * 100
    );
  });
};

const updateStrategyMultiplierStats = (
  strategy: string,
  multiplier: number
) => {
  if (!(strategy in strategyMultiplierStats)) {
    strategyMultiplierStats[strategy] = {
      count: 0,
      percent: 0,
      multiplier: {},
    };
  }

  strategyMultiplierStats[strategy].count += 1;

  if (!(multiplier in strategyMultiplierStats[strategy].multiplier)) {
    strategyMultiplierStats[strategy].multiplier[multiplier] = {
      count: 0,
      percent: 0,
    };
  }

  strategyMultiplierStats[strategy].multiplier[multiplier].count += 1;

  Object.keys(strategyMultiplierStats).forEach((strategyKey) => {
    const item = strategyMultiplierStats[strategyKey];
    item.percent = Math.floor((item.count / totalGames) * 100);

    Object.keys(item.multiplier).forEach((multiplierKey) => {
      const multiplierItem = item.multiplier[multiplierKey];
      multiplierItem.percent = Math.floor(
        (multiplierItem.count / totalGames) * 100
      );
    });
  });
};
