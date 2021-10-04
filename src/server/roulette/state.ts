import { fileLogger as logger } from "../common/logger";
import { config, strategies, utils } from "./app";
import { roulettePayout } from "./constants";
import { RouletteBet, RouletteGameResult } from "./enums";
import RouletteStats from "./stats";
import { getWinTypes, isMatchingStrategy } from "./trigger";
import {
  RouletteBetChipSize,
  RouletteBetClick,
  RouletteBetSize,
  RouletteClientAction,
  RouletteGameState,
  RouletteStrategy,
} from "./types";

export interface RouletteTableStateProps {
  chipSize: number[];
  tableName: string;
  lastNumber: number;
  lastNumbers: number[];
  gameState?: RouletteGameState;
}

class RouletteTableState implements RouletteTableStateProps {
  chipSize: number[];
  tableName: string;
  lastNumber: number;
  lastNumbers: number[];

  gameState?: RouletteGameState;

  constructor(tableName: string, numbers: number[], chipSize: number[]) {
    this.tableName = tableName;
    this.chipSize = [...chipSize];
    this.lastNumbers = [...numbers];
    this.lastNumber = [...numbers].pop();
  }

  writeGameBet(bets: RouletteBetSize): void {
    const gameBetsPath = utils.getGameBetsPath();

    const data = {
      ts: new Date(),
      bets,
      strategyName: this.gameState.strategyName,
      tableName: this.tableName,
    };

    utils.writeFile(gameBetsPath, data, "a");
  }

  processBet(bets: RouletteBetSize): void {
    logger.info(`bets: ${JSON.stringify(bets)}`);
    this.gameState.profit -= this.getBetTotalSize();
    this.writeGameBet(bets);
  }

  processNumber(
    stats: RouletteStats,
    number: number,
    balance: number
  ): RouletteClientAction {
    this.updateNumbers(number);

    if (this.gameState) {
      const gameResult = this.resultEvaluate();

      switch (gameResult) {
        case RouletteGameResult.WIN:
          logger.info("registered win");
          this.resetGameState(stats, gameResult);
          break;
        case RouletteGameResult.NULL:
          this.resetGameState(stats, gameResult);
          break;
        case RouletteGameResult.LOSE:
          logger.info("registered loss");
          this.resetGameState(stats, gameResult);
          break;
        case RouletteGameResult.PROGRESS:
          this.setNextBetProgression();
          break;
      }
    }

    if (!this.gameState) {
      this.findMatchingStrategy(balance);
    }

    return {
      bets: this.gameState?.bet,
      clicks: this.gameState?.betClick,
      chipSize: this.gameState?.betChipSize,
      strategyName: this.gameState?.strategyName,
    };
  }

  updateNumbers(value: number, limit = 500): void {
    this.lastNumber = value;
    this.lastNumbers.push(value);
    this.lastNumbers = this.lastNumbers.slice(-limit);
  }

  setupGameState(strategy: RouletteStrategy, strategyName: string): void {
    this.gameState = {
      bet: {} as RouletteBetSize,
      betClick: {} as RouletteBetClick,
      betStrategy: strategy,
      betProgression: 1,
      betChipSize: {} as RouletteBetChipSize,
      strategyName,
      profit: 0,
    };

    this.setNextBetSize();
  }

  resetGameState(stats: RouletteStats, result: RouletteGameResult): void {
    stats.updateStats(result, this.tableName, this.gameState);
    this.gameState = undefined;
  }

  setNextBetProgression(): void {
    this.gameState.betProgression += 1;
    this.setNextBetSize();
  }

  getNextChipSize(betSize: number): number {
    const defaultChipSize = this.chipSize.slice().shift();
    const reversedChipSize = this.chipSize.slice().reverse();

    for (const chipSize of reversedChipSize) {
      if (chipSize > betSize) {
        continue;
      } else if (chipSize === betSize) {
        return chipSize;
      } else {
        if (betSize % chipSize === 0) {
          return chipSize;
        }
      }
    }

    return defaultChipSize;
  }

  getBetTotalSize(): number {
    return Object.values(this.gameState.bet).reduce((a, b) => a + b, 0);
  }

  setNextBetSize(): void {
    for (const betConfig of this.gameState.betStrategy.bets) {
      const nextProgressionUnit =
        betConfig.progression[this.gameState.betProgression - 1];

      const betSize = betConfig.betSize * nextProgressionUnit;
      const betSizeFloat = parseFloat(betSize.toFixed(2));

      const betChipSize = this.getNextChipSize(betSizeFloat);
      const betChipSizeFloat = parseFloat(betChipSize.toFixed(2));

      const betClicks = betSizeFloat / betChipSizeFloat;
      const betClicksInt = parseInt(betClicks.toFixed(0));

      this.gameState.bet[betConfig.betType] = betSizeFloat;
      this.gameState.betClick[betConfig.betType] = betClicksInt;
      this.gameState.betChipSize[betConfig.betType] = betChipSizeFloat;
    }
  }

  findMatchingStrategy(balance: number): void {
    for (const strategyName in strategies) {
      const strategy = strategies[strategyName];

      if (strategy?.disabled ?? false) {
        continue;
      }

      if (!config.dryRun && strategy.minBalance > balance) {
        continue;
      }

      const isStrategyMatching = isMatchingStrategy(
        strategy.triggers,
        this.lastNumbers.slice()
      );

      if (isStrategyMatching) {
        logger.debug(`matched strategy - ${strategyName}`);
        this.setupGameState(strategy, strategyName);
        break;
      }
    }
  }

  calculateWinProfit(betWinTypes: RouletteBet[]): void {
    const betTypes = Object.keys(this.gameState.bet) as RouletteBet[];

    for (const betType of betTypes) {
      if (betWinTypes.includes(betType)) {
        const lastBetProfit =
          roulettePayout[betType] * this.gameState.bet[betType];

        this.gameState.profit += lastBetProfit;
        this.gameState.profit = parseFloat(this.gameState.profit.toFixed(2));
      }
    }
  }

  resultEvaluate(): RouletteGameResult {
    const betWinTypes = getWinTypes(this.lastNumber);

    let isWin = false;
    let result = RouletteGameResult.PROGRESS;

    this.gameState.betStrategy.bets.forEach((betConfig) => {
      isWin = isWin || betWinTypes.includes(betConfig.betType);
    });

    if (isWin) {
      this.calculateWinProfit(betWinTypes);

      result =
        this.gameState.profit > 0
          ? RouletteGameResult.WIN
          : RouletteGameResult.NULL;
    } else {
      const stopLossLimit = this.gameState.betStrategy?.limits?.stopLoss ?? 0;

      if (this.gameState.betProgression === stopLossLimit) {
        result = RouletteGameResult.LOSE;
      }
    }

    return result;
  }
}

export default RouletteTableState;
