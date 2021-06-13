import {
  ResultStats,
  MultiplierStats,
  StrategyMultiplierStats,
  GameStats,
  GameResult,
} from "./types";

export const resultStats: ResultStats = {
  gamesWin: 0,
  gamesLose: 0,
  gamesAborted: 0,
};

const multiplierStats: MultiplierStats = {};
const strategyMultiplierStats: StrategyMultiplierStats = {};

export const getStats = (): GameStats => {
  return {
    resultStats,
    multiplierStats,
    strategyMultiplierStats,
  };
};

export const updateStats = (
  result: GameResult,
  strategy: string,
  multiplier: number
): void => {
  updateGameStats(result);
  updateMultiplierStats(multiplier);
  updateStrategyMultiplierStats(strategy, multiplier);
};

const updateGameStats = (result: GameResult): void => {
  switch (result) {
    case GameResult.WIN:
      resultStats.gamesWin += 1;
      break;
    case GameResult.LOSE:
      resultStats.gamesLose += 1;
      break;
    case GameResult.ABORT:
      resultStats.gamesAborted += 1;
      break;
  }
};

const updateMultiplierStats = (multiplier: number) => {
  const totalGames = Object.values(resultStats).reduce(
    (obj, item) => obj + item,
    0
  );

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
  const totalGames = Object.values(resultStats).reduce(
    (obj, item) => obj + item,
    0
  );

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
