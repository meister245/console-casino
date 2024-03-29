import { RouletteNumbers, RoulettePayout } from "./types";

export const rouletteNumbers: RouletteNumbers = {
  straightZero: [0],
  red: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
  black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35],
  low: [...Array(18).keys()].map((n) => n + 1),
  high: [...Array(18).keys()].map((n) => n + 19),
  odd: [...Array(18).keys()].map((n) => (n + 1) * 2 - 1),
  even: [...Array(18).keys()].map((n) => (n + 1) * 2),
  dozenFirst: [...Array(12).keys()].map((n) => n + 1),
  dozenSecond: [...Array(12).keys()].map((n) => n + 13),
  dozenThird: [...Array(12).keys()].map((n) => n + 25),
  columnTop: [...Array(12).keys()].map((n) => (n + 1) * 3),
  columnMiddle: [...Array(12).keys()].map((n) => (n + 1) * 3 - 1),
  columnBottom: [...Array(12).keys()].map((n) => (n + 1) * 3 - 2),
  lineOne: [...Array(6).keys()].map((n) => n + 1),
  lineTwo: [...Array(6).keys()].map((n) => n + 4),
  lineThree: [...Array(6).keys()].map((n) => n + 7),
  lineFour: [...Array(6).keys()].map((n) => n + 10),
  lineFive: [...Array(6).keys()].map((n) => n + 13),
  lineSix: [...Array(6).keys()].map((n) => n + 16),
  lineSeven: [...Array(6).keys()].map((n) => n + 19),
  lineEight: [...Array(6).keys()].map((n) => n + 22),
  lineNine: [...Array(6).keys()].map((n) => n + 25),
  lineTen: [...Array(6).keys()].map((n) => n + 28),
  lineEleven: [...Array(6).keys()].map((n) => n + 31),
};

export const roulettePayout: RoulettePayout = {
  straightZero: 36,
  red: 2,
  black: 2,
  low: 2,
  high: 2,
  odd: 2,
  even: 2,
  dozenFirst: 3,
  dozenSecond: 3,
  dozenThird: 3,
  columnTop: 3,
  columnMiddle: 3,
  columnBottom: 3,
  lineOne: 6,
  lineTwo: 6,
  lineThree: 6,
  lineFour: 6,
  lineFive: 6,
  lineSix: 6,
  lineSeven: 6,
  lineEight: 6,
  lineNine: 6,
  lineTen: 6,
  lineEleven: 6,
};
