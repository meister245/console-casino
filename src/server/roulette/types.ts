import { RouletteBet, RouletteTriggerAction } from "./enums";

export type RouletteNumbers = {
  [item in RouletteBet]: number[];
};

export type RoulettePayout = {
  [item in RouletteBet]: number;
};

export type RouletteBetChipSize = {
  [entry in RouletteBet]: number;
};

export type RouletteBetClick = {
  [entry in RouletteBet]: number;
};

export type RouletteBetSize = {
  [entry in RouletteBet]: number;
};

export type RouletteBotConfig = {
  config: RouletteConfig;
  strategies: RouletteStrategies;
};

export type RouletteConfig = {
  dryRun: boolean;
  stopOnLoss: boolean;
  driverName: string;
  resetUrl: string;
  tableNames: string[];
  backtestCollection?: boolean;
  backtestCollectionInterval?: number;
};

export type RouletteStrategies = {
  [entry: string]: RouletteStrategy;
};

export type RouletteBetConfig = {
  betType: RouletteBet;
  betSize: number;
  progression: number[];
};

export type RouletteStrategy = {
  bets: RouletteBetConfig[];
  minBalance: number;
  limits: RouletteLimits;
  triggers: RouletteTriggers;
  group?: string;
  disabled?: boolean;
};

type RouletteLimits = {
  stopWin?: number;
  stopLoss?: number;
  suspendLoss?: number;
};

export type RouletteDistributionTrigger = {
  betType: RouletteBet;
  percentage: number;
  sampleSize: number;
  action: RouletteTriggerAction;
};

export type RouletteTriggers = {
  pattern?: Array<RouletteBet[]>;
  distribution?: RouletteDistributionTrigger[];
};

export type RouletteClientAction = {
  bets: RouletteBetSize;
  clicks: RouletteBetClick;
  chipSize: RouletteBetChipSize;
  strategyName: string;
};

export type RouletteBacktestCollectionState = {
  [tableName: string]: number;
};

export type RouletteGameState = {
  bet: RouletteBetSize;
  betClick: RouletteBetClick;
  betStrategy: RouletteStrategy;
  betProgression: number;
  betChipSize: RouletteBetChipSize;
  strategyName: string;
  profit: number;
};

export type RouletteGameResultCounter = {
  gamesWin: number;
  gamesLose: number;
  gamesNull: number;
  gamesAbort: number;
};

export type RouletteTableStats = {
  [entry: string]: RouletteGameResultCounter;
};

export type RouletteProgressionStats = {
  [progression: string]: {
    count: number;
    profit: number;
    percent: number;
  };
};

export type RouletteStrategyStatsDetails = {
  count: number;
  profit: number;
  percent: number;
  results: RouletteGameResultCounter;
  progression: RouletteProgressionStats;
};

export type RouletteStrategyStats = {
  [strategy: string]: RouletteStrategyStatsDetails;
};
