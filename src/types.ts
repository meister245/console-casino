import { BetRequestAction } from "./client/rest";
import { ServerGameState, ServerState } from "./server/state";

export { BetRequestAction, ServerGameState, ServerState };

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
  chipSize: number;
  dryRun: boolean;
  stopOnLoss: boolean;
  driverName: string;
  minBalance: number;
  lobbyUrl: string;
  tableRegex: string[];
  backtestCollection?: boolean;
}

export interface RouletteStrategies {
  [entry: string]: RouletteStrategy;
}

export interface RouletteStrategy {
  bets: RouletteBet[];
  limits: RouletteLimits;
  progression: number[];
  trigger: RouletteTriggers;
  parent?: string[];
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
