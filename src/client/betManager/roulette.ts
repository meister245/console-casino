import {
  messageRegexInactive,
  messageRegexInProgress,
  rouletteNumbers,
  roulettePayout,
  serverGameStoppedUrl,
} from "../../constants";
import {
  GameResult,
  RouletteBet,
  RouletteBetConfig,
  RouletteBetSize,
  RouletteConfig,
  RouletteNumbers,
  RouletteStrategies,
  RouletteStrategy,
  RouletteTriggerDistribution,
  ServerGameState,
} from "../../types";
import Playtech from "../driver/playtech";
import RESTClient from "../rest";
import ClientState, { GameStage, GameState } from "../state";

enum TableMessage {
  WAIT = "wait for the next round",
  BETS = "place your bets",
  LAST_BETS = "last bets",
  EMPTY = "",
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

class RouletteBetManager extends RESTClient {
  private driver: Playtech;
  private config: RouletteConfig;
  private strategies: RouletteStrategies;

  private running: boolean;

  private lastLogMessage: null | string;
  private timeResetDiff: number;
  private timeStarted: number;
  private backtestCollection: boolean;

  state: ClientState;

  constructor(
    driver: Playtech,
    config: RouletteConfig,
    strategies: RouletteStrategies
  ) {
    super();

    this.config = config;
    this.driver = driver;
    this.strategies = strategies;

    this.running = true;

    this.lastLogMessage = null;
    this.timeStarted = Math.floor(Date.now() / 1000);
    this.timeResetDiff = 60 * this.getRandomRangeNumber(18, 23);
    this.backtestCollection = config?.backtestCollection ?? false;

    this.state = new ClientState();
  }

  isActive(): boolean {
    return this.running;
  }

  getRandomRangeNumber = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min)) + min;

  async reload(tableName: string): Promise<void> {
    this.running = false;
    await this.deleteTable(tableName);
    window.location.href = this.config.lobbyUrl;
  }

  async runStage(): Promise<void> {
    if (this.isActive()) {
      const dealerMessage = this.driver
        .getDealerMessage()
        .toLowerCase() as TableMessage;

      switch (this.state.gameStage) {
        case GameStage.SETUP:
          await this.runStageSetup(dealerMessage);
          break;
        case GameStage.BET:
          await this.runStageBet(dealerMessage);
          break;
        case GameStage.WAIT:
          await this.runStageWait(dealerMessage);
          break;
        case GameStage.RESULTS:
          await this.runStageResult(dealerMessage);
          break;
      }
    }
  }

  async isReloadRequired(): Promise<boolean> {
    if (!this.state.gameState) {
      const timeDiff = Math.floor(Date.now() / 1000) - this.timeStarted;

      if (timeDiff > this.timeResetDiff) {
        return true;
      }
    }

    for (const msg of this.driver.getMessages()) {
      if (msg && msg.match(messageRegexInactive)) {
        this.logMessage("table inactive");

        if (this.state.gameState) {
          await this.postBetReset(
            GameResult.ABORT,
            this.state.gameState,
            this.driver.getTableName()
          );
        }

        return true;
      }

      if (msg && msg.match(messageRegexInProgress)) {
        this.logMessage("table session unfinished");
        return true;
      }
    }

    return false;
  }

  async runStageSetup(dealerMessage: TableMessage): Promise<void> {
    this.logMessage("waiting for next spin");

    if (dealerMessage === TableMessage.WAIT) {
      this.state.setGameStage(GameStage.BET);
    }
  }

  async runStageBet(dealerMessage: TableMessage): Promise<void> {
    this.logMessage("waiting to be able to place bets");

    const isDealerMessageMatching = [
      TableMessage.BETS,
      TableMessage.LAST_BETS,
    ].includes(dealerMessage);

    if (isDealerMessageMatching) {
      const tableName = this.driver.getTableName();
      const serverState = await this.getServerState(tableName);

      if (!serverState.running) {
        window.location.href = serverGameStoppedUrl;
        return;
      }

      if (!this.state.gameState && this.validateChipSize(serverState)) {
        const balance = this.driver.getBalance();
        const tableName = this.driver.getTableName();
        const numberHistory = this.driver.getNumberHistory();

        await this.findMatchingStrategy(
          balance,
          numberHistory,
          serverState,
          tableName
        );
      }

      if (this.state.gameState && this.validateChipSize(this.state.gameState)) {
        this.state.backupGameState();
        this.state.setNextBetSize();
        await this.submitBets(tableName);
      }

      this.state.setGameStage(GameStage.WAIT);
    }
  }

  async findMatchingStrategy(
    balance: number,
    numberHistory: number[],
    serverState: ServerGameState,
    tableName: string
  ): Promise<void> {
    for (const strategyName in this.strategies) {
      const strategy = this.strategies[strategyName];

      if (strategy.maxBalance && strategy.maxBalance < balance) {
        continue;
      }

      if (!this.config.dryRun && strategy.minBalance > balance) {
        continue;
      }

      const isStrategyMatching = this.isMatchingStrategy(
        strategy,
        numberHistory,
        serverState?.betStrategy,
        serverState?.suspended ?? false
      );

      if (isStrategyMatching) {
        await this.registerBet(strategyName, strategy, tableName);
        break;
      }
    }
  }

  isMatchingStrategy(
    strategy: RouletteStrategy,
    numberHistory: number[],
    lastBetStrategy: string,
    lastGameSuspended: boolean
  ): boolean {
    let suspendedMatching = false;
    let triggerPatternMatching = false;
    let triggerPercentageMatching = false;

    const { trigger, parent } = strategy;
    const reversedHistory = numberHistory.slice().reverse();

    if (parent && parent.includes(lastBetStrategy)) {
      suspendedMatching = true;
    }

    if (lastGameSuspended !== suspendedMatching) {
      return false;
    }

    triggerPatternMatching = this.isPatternMatching(
      reversedHistory,
      trigger.pattern
    );

    triggerPercentageMatching = this.isPercentageMatching(
      reversedHistory,
      trigger.distribution
    );

    return triggerPatternMatching && triggerPercentageMatching;
  }

  async registerBet(
    strategyName: string,
    strategy: RouletteStrategy,
    tableName: string
  ): Promise<void> {
    this.logMessage(`strategy matched - ${strategyName}`);

    const { success, state } = await this.postBetInit(strategyName, tableName);

    if (success) {
      this.logMessage("server accepted bet");
      this.state.setupGameState(strategy, state.betStrategy, state.suspended);
    } else {
      this.logMessage("server refused bet");
    }
  }

  async runStageWait(dealerMessage: TableMessage): Promise<void> {
    this.logMessage("waiting for next round");

    const currentBetSize = this.state.gameState?.betSize ?? 0;

    const expectedMessage =
      !this.config.dryRun && currentBetSize > 0
        ? TableMessage.EMPTY
        : TableMessage.WAIT;

    if (dealerMessage === expectedMessage) {
      if (this.state.gameState) {
        this.state.setGameStage(GameStage.RESULTS);
      } else {
        this.state.setGameStage(GameStage.BET);
      }
    }

    if (this.backtestCollection) {
      const tableName = this.driver.getTableName();
      const numberHistory = this.driver.getNumberHistory();

      await this.postTableBacktest(tableName, numberHistory);
      this.backtestCollection = !this.backtestCollection;
    }
  }

  async runStageResult(dealerMessage: TableMessage): Promise<void> {
    this.logMessage("waiting for result");

    if ([TableMessage.BETS, TableMessage.LAST_BETS].includes(dealerMessage)) {
      this.logMessage("processing results");

      const tableName = this.driver.getTableName();
      const lastNumber = this.driver.getLastNumber();

      if (isNaN(lastNumber)) {
        this.state.restoreGameState();
        this.driver.closeMessages();
      }

      if (!isNaN(lastNumber) && this.state.gameState) {
        await this.resultEvaluate(lastNumber, tableName);
      }

      this.state.setGameStage(GameStage.BET);
    }
  }

  resultEvaluate(lastNumber: number, tableName: string): Promise<void> {
    const stopLossLimit = this.state.gameStrategy?.limits?.stopLoss ?? 0;
    const suspendLossLimit = this.state.gameStrategy?.limits?.suspendLoss ?? 0;

    const betWinTypes = this.getBetWinTypes(lastNumber);
    const isWin = betWinTypes.length > 0;

    if (isWin) {
      return this.resultWinHandler(betWinTypes, tableName);
    }

    if (!isWin && suspendLossLimit > 0) {
      const isSuspendLossReached =
        this.state.gameState.betProgression === suspendLossLimit;

      return this.resultSuspendLossHandler(isSuspendLossReached, tableName);
    }

    if (!isWin && stopLossLimit > 0) {
      const isStopLossReached =
        this.state.gameState.betProgression === stopLossLimit;

      return this.resultStopLossHandler(isStopLossReached, tableName);
    }
  }

  getBetWinTypes(lastNumber: number): RouletteBet[] {
    const betWinTypes = [] as RouletteBet[];
    const winTypes = this.getWinTypes(lastNumber);

    this.state.gameStrategy.bets.forEach((config: RouletteBetConfig) => {
      if (winTypes.includes(config.betType)) {
        betWinTypes.push(config.betType);
      }
    });

    return betWinTypes;
  }

  async resultWinHandler(
    betWinTypes: RouletteBet[],
    tableName: string
  ): Promise<void> {
    this.calculateWinProfit(betWinTypes);

    const gameResult =
      this.state.gameState.profit > 0 ? GameResult.WIN : GameResult.NULL;

    const { success } = await this.postBetReset(
      gameResult,
      this.state.gameState,
      tableName
    );
    success && this.logMessage("registered win, reset server state");
    this.state.resetGameState();
  }

  async resultSuspendLossHandler(
    isSuspendLossReached: boolean,
    tableName: string
  ): Promise<void> {
    if (!isSuspendLossReached) {
      const { success } = await this.postBetUpdate(
        this.state.gameState.betSize,
        this.state.gameState.betProgression,
        tableName
      );
      success && this.logMessage("updated bet size, updated server state");
      this.state.setNextBetProgression();
    } else if (isSuspendLossReached) {
      const { success } = await this.postBetSuspend(
        this.state.gameState.betSize,
        this.state.gameState.betStrategy,
        tableName
      );
      success && this.logMessage("suspend limit reached, reset server state");
      this.state.resetGameState();
    }
  }

  async resultStopLossHandler(
    isStopLossReached: boolean,
    tableName: string
  ): Promise<void> {
    if (!isStopLossReached) {
      const { success } = await this.postBetUpdate(
        this.state.gameState.betSize,
        this.state.gameState.betProgression,
        tableName
      );
      success && this.logMessage("updated bet size, updated server state");
      this.state.setNextBetProgression();
    } else if (isStopLossReached) {
      const { success } = await this.postBetReset(
        GameResult.LOSE,
        this.state.gameState,
        tableName
      );
      success && this.logMessage("registered loss, reset server state");
      this.state.resetGameState();
    }
  }

  calculateWinProfit(betWinTypes: RouletteBet[]): void {
    for (const betType of betWinTypes) {
      const lastBetProfit =
        roulettePayout[betType] * this.state.gameState.betSize[betType];

      this.state.gameState.profit += lastBetProfit;

      this.state.gameState.profit = parseFloat(
        this.state.gameState.profit.toFixed(2)
      );
    }
  }

  async submitBets(tableName: string): Promise<void> {
    this.logMessage(`bet strategy: ${this.state.gameState.betStrategy}`);

    let totalBetSize = 0;

    !this.config.dryRun && (await sleep(2000));

    for (const betConfig of this.state.gameStrategy.bets) {
      !this.config.dryRun && this.driver.setChipSize(betConfig.chipSize);

      const clickTimes = Math.round(
        this.state.gameState.betSize[betConfig.betType] / betConfig.chipSize
      );

      for (let step = 0; step < clickTimes; step++) {
        !this.config.dryRun && this.driver.setBet(betConfig.betType);
        totalBetSize += betConfig.chipSize.valueOf();
      }
    }

    if (totalBetSize > 0) {
      await this.postBetLog({
        tableName: tableName,
        betSize: this.state.getBetSizeTotal(),
        betStrategy: this.state.gameState.betStrategy,
      });

      this.state.gameState.profit -= totalBetSize;

      this.state.gameState.profit = parseFloat(
        this.state.gameState.profit.toFixed(2)
      );
    }

    this.logMessage(`bets: ${this.state.gameStrategy.bets}`);
    this.logMessage(`total: ${totalBetSize.toFixed(2)}`);
  }

  isPercentageMatching(
    numberHistory: number[],
    config: RouletteTriggerDistribution[]
  ): boolean {
    let success = true;

    for (const distribution of config) {
      if (numberHistory.length < distribution.sampleSize) {
        return false;
      }

      const sampleNumberSet = numberHistory.slice(0, distribution.sampleSize);

      const betNumbers =
        rouletteNumbers[distribution.betType as keyof RouletteNumbers];

      let occurrence = 0;

      sampleNumberSet.forEach((n) => {
        if (betNumbers.includes(n)) {
          occurrence = occurrence + 1;
        }
      });

      const percentage = Math.floor(
        (occurrence / sampleNumberSet.length) * 100
      );

      switch (distribution.action) {
        case "lowerEqual":
          success = success && percentage <= distribution.percentage;
          break;
        case "equal":
          success = success && percentage === distribution.percentage;
          break;
        case "higherEqual":
          success = success && percentage >= distribution.percentage;
          break;
        default:
          success = false;
      }
    }

    return success;
  }

  validateChipSize(state: ServerGameState | GameState): boolean {
    let result = true;
    const betSize = state?.betSize ?? ({} as RouletteBetSize);

    if (Object.keys(betSize).length === 0) {
      return true;
    }

    for (const value of Object.values(betSize)) {
      let betSizeTemp = value.valueOf();
      let smallestChipSize = this.driver.getChipSizes()[0];

      while (smallestChipSize < 0) {
        betSizeTemp = betSizeTemp * 10;
        smallestChipSize = smallestChipSize * 10;
      }

      const remainder = Math.round(betSizeTemp % smallestChipSize);
      result = result && smallestChipSize <= betSizeTemp && remainder === 0;
    }

    return result;
  }

  isPatternMatching(numberHistory: number[], pattern: string[]): boolean {
    for (const i in pattern) {
      const betPattern = pattern[i];
      const resultNumber = numberHistory[i];
      const resultWinTypes = this.getWinTypes(resultNumber);

      let matchResult = false;

      for (const pattern of betPattern.split(",")) {
        matchResult = matchResult || resultWinTypes.includes(pattern);
      }

      if (!matchResult) {
        return false;
      }
    }

    return true;
  }

  getWinTypes(lastNumber: number): string[] {
    const winTypes = [];

    for (const betType in rouletteNumbers) {
      const winType = rouletteNumbers[betType as keyof RouletteNumbers];

      if (winType.includes(lastNumber)) {
        winTypes.push(betType);
      }
    }

    return winTypes;
  }

  logMessage(msg: string): void {
    const logMessage = ["console-casino", this.state.gameStage, msg];

    if (logMessage.toString() !== this.lastLogMessage) {
      this.lastLogMessage = logMessage.toString();
      console.log(logMessage.join(" - "));
    }
  }
}

export default RouletteBetManager;
