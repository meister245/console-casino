export enum GameResult {
  WIN = "win",
  LOSE = "lose",
  ABORT = "abort",
}

export interface ServerState {
  tables: string[];
  active: boolean;
  suspended: boolean;
  betSize?: number;
  betStrategy?: string;
  tableName?: string;
}

export type GameStats = {
  totalGames: number;
  tableStats: TableStats;
  multiplierStats: MultiplierStats;
  strategyMultiplierStats: StrategyMultiplierStats;
};

export interface TableStats {
  [result: string]: {
    gamesWin: number;
    gamesLose: number;
    gamesAbort: number;
  };
}
export interface MultiplierStats {
  [multiplier: string]: {
    count: number;
    percent: number;
  };
}

export interface StrategyMultiplierStats {
  [strategy: string]: {
    count: number;
    percent: number;
    multiplier: MultiplierStats;
  };
}

export type RouletteBotConfig = {
  config: RouletteConfig;
  strategies: RouletteStrategies;
};

export interface RouletteConfig {
  chipSize: number;
  dryRun: boolean;
  driverName: string;
  minBalance: number;
  lobbyUrl: string;
  tables: string[];
}

export interface RouletteStrategies {
  [entry: string]: RouletteStrategy;
}

export interface RouletteStrategy {
  bets: string[];
  limits: RouletteLimits;
  progressionMultiplier: number;
  trigger: RouletteTriggers;
}

interface RouletteLimits {
  stopWin?: number;
  stopLoss?: number;
  suspendLoss?: number;
}

export interface RouletteTriggers {
  parent?: string[];
  pattern?: string[];
  distribution?: (string | number)[];
}
