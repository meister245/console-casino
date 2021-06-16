import { ServerGameState, ServerState } from "./state";

export { ServerGameState, ServerState };

export enum GameResult {
  WIN = "win",
  LOSE = "lose",
  ABORT = "abort",
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
