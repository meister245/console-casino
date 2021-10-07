import memoize from "memoizee";

import { rouletteNumbers } from "./constants";
import { RouletteBet, RouletteTriggerAction } from "./enums";
import {
  RouletteDistributionTrigger,
  RouletteNumbers,
  RouletteTriggers,
} from "./types";

export const getWinTypes = memoize((value: number): RouletteBet[] => {
  const winTypes = [] as RouletteBet[];

  for (const betType in rouletteNumbers) {
    const winType = rouletteNumbers[betType as keyof RouletteNumbers];

    if (winType.includes(value)) {
      winTypes.push(betType as RouletteBet);
    }
  }

  return winTypes;
});

export const isPatternMatching = (
  numberHistory: number[],
  patterns: Array<RouletteBet[]>
): boolean => {
  const reversedNumberHistory = numberHistory.slice().reverse();

  let matchResult = false;

  for (const pattern of patterns) {
    let itemResult = true;

    for (let i = 0; i < pattern.length; i++) {
      const betType = pattern[i];
      const resultNumber = reversedNumberHistory[i];
      const resultWinTypes = getWinTypes(resultNumber);

      itemResult = itemResult && resultWinTypes.includes(betType);
    }

    matchResult = matchResult || itemResult;
  }

  return matchResult;
};

export const isPercentageMatching = (
  numberHistory: number[],
  config: RouletteDistributionTrigger[]
): boolean => {
  let success = true;

  for (const distribution of config) {
    if (numberHistory.length < distribution.sampleSize) {
      return false;
    }

    const sampleNumberSet = numberHistory.slice(0, distribution.sampleSize);
    const betNumbers = rouletteNumbers[distribution.betType];

    let occurrence = 0;

    sampleNumberSet.forEach((n) => {
      if (betNumbers.includes(n)) {
        occurrence = occurrence + 1;
      }
    });

    const percentage = Math.floor((occurrence / sampleNumberSet.length) * 100);

    switch (distribution.action) {
      case RouletteTriggerAction.LOWER_EQUAL:
        success = success && percentage <= distribution.percentage;
        break;
      case RouletteTriggerAction.EQUAL:
        success = success && percentage === distribution.percentage;
        break;
      case RouletteTriggerAction.HIGHER_EQUAL:
        success = success && percentage >= distribution.percentage;
        break;
      default:
        success = false;
    }
  }

  return success;
};

export const isMatchingStrategy = (
  triggers: RouletteTriggers,
  numberHistory: number[]
): boolean => {
  const triggerPatternMatching = triggers.pattern
    ? isPatternMatching(numberHistory, triggers.pattern)
    : true;

  const triggerPercentageMatching = triggers.distribution
    ? isPercentageMatching(numberHistory, triggers.distribution)
    : true;

  return triggerPatternMatching && triggerPercentageMatching;
};
