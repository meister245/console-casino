import {
  ServerState,
  RouletteBotConfig,
  RouletteConfig,
  RouletteStrategy,
  RouletteStrategies,
} from "../server/types";

export {
  ServerState,
  RouletteBotConfig,
  RouletteConfig,
  RouletteStrategy,
  RouletteStrategies,
};

export interface DriverSelectors {
  chip: ChipSelectors;
  roulette: RouletteSelectors;
}

interface ChipSelectors {
  [item: number]: string;
}

interface RouletteSelectors {
  [item: string]: string;
}

export enum Driver {
  PLAYTECH = "playtech",
}

export enum TableMessage {
  WAIT = "wait for the next round",
  BETS = "place your bets",
  LAST_BETS = "last bets",
  EMPTY = "",
}

export enum GameStage {
  BET = "stage-bet",
  SPIN = "stage-spin",
  WAIT = "stage-wait",
  RESULTS = "stage-results",
}

export enum GameResult {
  WIN = "win",
  LOSE = "lose",
  ABORT = "abort",
}

export enum BetRequestAction {
  INIT = "init",
  UPDATE = "update",
  SUSPEND = "suspend",
  RESET = "reset",
}

export interface ClientState {
  gameCount: number;
  gameState: GameState | null;
  gameStage: GameStage;
}

export interface BetRequestProps {
  action: BetRequestAction;
  betStrategy?: string;
  betMultiplier?: number;
  betResult?: GameResult;
  betSize?: number;
  tableName?: string;
}

export interface GameState {
  bets: string[];
  betSize: number;
  betStrategy: string;
  suspended: boolean;
  progressionCount: number;
  progressionMultiplier: number;
  stopWinLimit: number;
  stopLossLimit: number;
  suspendLossLimit: number;
}

export interface BetRequestResponse {
  success: boolean;
  serverState: ServerState;
}
