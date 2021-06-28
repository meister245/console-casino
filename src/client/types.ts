import {
  RouletteBotConfig,
  RouletteConfig,
  RouletteStrategies,
  RouletteStrategy,
  RouletteTriggerDistribution,
  RouletteTriggers,
  ServerGameState,
  ServerState,
} from "../server/types";

export {
  RouletteBotConfig,
  RouletteConfig,
  RouletteStrategies,
  RouletteStrategy,
  RouletteTriggerDistribution,
  RouletteTriggers,
  ServerGameState,
  ServerState,
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

export interface ClientState {
  gameStage: GameStage;
  gameState: GameState | null;
  gameStrategy: RouletteStrategy | null;
}

export interface GameState {
  betSize: number;
  betStrategy: string;
  suspended: boolean;
  progressionCount: number;
}

export type RouletteNumbers = {
  red: number[];
  black: number[];
  low: number[];
  high: number[];
  odd: number[];
  even: number[];
  dozenFirst: number[];
  dozenSecond: number[];
  dozenThird: number[];
  columnTop: number[];
  columnMiddle: number[];
  columnBottom: number[];
};
