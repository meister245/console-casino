import { BetRequestAction } from "./client/rest";
import { ServerGameState, ServerState } from "./server/state";
import { ServerStats } from "./server/stats";

export { BetRequestAction, ServerGameState, ServerState, ServerStats };

export enum GameResult {
  WIN = "win",
  LOSE = "lose",
  NULL = "null",
  ABORT = "abort",
}

export enum RouletteBet {
  RED = "red",
  BLACK = "black",
  LOW = "low",
  HIGH = "high",
  ODD = "odd",
  EVEN = "even",
  DOZEN_FIRST = "dozenFirst",
  DOZEN_SECOND = "dozenSecond",
  DOZEN_THIRD = "dozenThird",
  COLUMN_TOP = "columnTop",
  COLUMN_MIDDLE = "columnMiddle",
  COLUMN_BOTTOM = "columnBottom",
  LINE_ONE = "lineOne",
  LINE_TWO = "lineTwo",
  LINE_THREE = "lineThree",
  LINE_FOUR = "lineFour",
  LINE_FIVE = "lineFive",
  LINE_SIX = "lineSix",
  LINE_SEVEN = "lineSeven",
  LINE_EIGHT = "lineEight",
  LINE_NINE = "lineNine",
  LINE_TEN = "lineTen",
  LINE_ELEVEN = "lineEleven",
}

export type RouletteBetSize = {
  [entry in RouletteBet]: number;
};

export type RouletteNumbers = {
  [item in RouletteBet]: number[];
};

export type RoulettePayout = {
  [item in RouletteBet]: number;
};

export type RouletteBotConfig = {
  config: RouletteConfig;
  strategies: RouletteStrategies;
};

export interface RouletteConfig {
  dryRun: boolean;
  stopOnLoss: boolean;
  driverName: string;
  lobbyUrl: string;
  tableRegex: string[];
  backtestCollection?: boolean;
  backtestCollectionInterval?: number;
}

export interface RouletteStrategies {
  [entry: string]: RouletteStrategy;
}

export interface RouletteBetConfig {
  betType: RouletteBet;
  betSize: number;
  chipSize: number;
  progression: number[];
}

export interface RouletteStrategy {
  bets: RouletteBetConfig[];
  disabled?: boolean;
  minBalance: number;
  limits: RouletteLimits;
  trigger: RouletteTriggers;
  parent?: string[];
  group?: string;
}

interface RouletteLimits {
  stopWin?: number;
  stopLoss?: number;
  suspendLoss?: number;
}

export interface RouletteTriggerDistribution {
  betType: string;
  percentage: number;
  sampleSize: number;
  action: string;
}

export interface RouletteTriggers {
  parent?: string[];
  pattern?: string[];
  distribution?: RouletteTriggerDistribution[];
}
