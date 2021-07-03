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

enum RouletteBet {
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
