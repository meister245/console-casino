export enum RouletteBet {
  STRAIGHT_ZERO = "straightZero",
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

export enum RouletteTriggerAction {
  LOWER_EQUAL = "lowerEqual",
  EQUAL = "equal",
  HIGHER_EQUAL = "higherEqual",
}

export enum RouletteGameResult {
  WIN = "win",
  LOSE = "lose",
  NULL = "null",
  ABORT = "abort",
  PROGRESS = "progress",
}
