import {
  RouletteBet,
  RouletteTriggerAction,
} from "../src/server/roulette/enums";

export const testTableName = "unittestTable";
export const testStrategyName = "unittestStrategy";
export const testChipSize = [0.1, 0.2, 0.25, 0.5, 1, 2];

export const betStrategyLowTriggerHighPercent = {
  bets: [
    {
      betSize: 0.1,
      betType: "low" as RouletteBet,
      chipSize: 0.1,
      progression: [0, 1, 2, 4, 8],
    },
  ],
  limits: {
    stopWin: 1,
    stopLoss: 5,
  },
  minBalance: 20,
  triggers: {
    distribution: [
      {
        betType: "high" as RouletteBet,
        sampleSize: 10,
        percentage: 25,
        action: "higherEqual" as RouletteTriggerAction,
      },
    ],
  },
};

export const betStrategyHighTriggerLineSevenPercent = {
  bets: [
    {
      betSize: 0.1,
      betType: "high" as RouletteBet,
      chipSize: 0.1,
      progression: [0, 1, 2, 4, 8],
    },
  ],
  limits: {
    stopWin: 1,
    stopLoss: 5,
  },
  minBalance: 20,
  triggers: {
    distribution: [
      {
        betType: "lineSeven" as RouletteBet,
        sampleSize: 50,
        percentage: 30,
        action: "higherEqual" as RouletteTriggerAction,
      },
    ],
  },
};

export const betStrategyRedLowTriggerLineSevenPercent = {
  bets: [
    {
      betSize: 0.1,
      betType: "red" as RouletteBet,
      chipSize: 0.1,
      progression: [0, 1, 2, 4, 8],
    },
    {
      betSize: 0.5,
      betType: "low" as RouletteBet,
      chipSize: 0.1,
      progression: [1, 3, 2, 4, 5],
    },
  ],
  limits: {
    stopWin: 1,
    stopLoss: 5,
  },
  minBalance: 20,
  triggers: {
    distribution: [
      {
        betType: "lineSeven" as RouletteBet,
        sampleSize: 50,
        percentage: 30,
        action: "higherEqual" as RouletteTriggerAction,
      },
    ],
  },
};
