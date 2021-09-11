import {
  RouletteBet,
  RouletteTriggerAction,
} from "../src/server/roulette/enums";

export const dataInit = {
  action: "init",
  betStrategy: "testStrategy",
  tableName: "testTable",
};

export const dataUpdate = {
  action: "update",
  betSize: 0.1,
  tableName: "testTable",
};

export const dataSuspend = {
  action: "suspend",
  betStrategy: "testStrategy",
  betSize: 0.2,
  tableName: "testTable",
};

export const dataReset = {
  action: "reset",
  betStrategy: "testStrategy",
  betResult: "win",
  betMultiplier: 2,
  tableName: "testTable",
};

export const betStrategySingleBet = {
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

export const betStrategyMultiBet = {
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
