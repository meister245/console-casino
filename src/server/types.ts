import { ServerGameState, ServerState } from "./state";
import { ServerStats } from "./stats";

export { ServerGameState, ServerState, ServerStats };

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
  stopOnLoss: boolean;
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
