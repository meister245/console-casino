import {
  messageRegexInactive,
  messageRegexInProgress,
  rouletteNumbers,
  roulettePayout,
  serverGameStoppedUrl,
} from "../../constants";
import {
  GameResult,
  RouletteConfig,
  RouletteNumbers,
  RouletteStrategies,
  RouletteStrategy,
  RouletteTriggerDistribution,
  RouletteTriggers,
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

class RouletteBetManager extends RESTClient {
  private driver: Playtech;
  private config: RouletteConfig;
  private state: ClientState;
  private strategies: RouletteStrategies;

  private running: boolean;
  private lastLogMessage: null | string;
  private timeResetDiff: number;
  private timeStarted: number;

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
        case GameStage.SPIN:
          this.runStageSpin(dealerMessage);
          break;
        case GameStage.BET:
          await this.runStageBet(dealerMessage);
          break;
        case GameStage.WAIT:
          this.runStageWait(dealerMessage);
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

  runStageSpin(dealerMessage: TableMessage): void {
    this.logMessage("waiting for next spin");

    if (dealerMessage === TableMessage.WAIT) {
      this.state.gameStage = GameStage.BET;
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
        const numberHistory = this.driver.getNumberHistory();

        for (const strategyName in this.strategies) {
          const strategy = this.strategies[strategyName];

          const isStrategyMatching = this.isMatchingStrategy(
            strategy.trigger,
            numberHistory,
            serverState.betStrategy,
            serverState.suspended
          );

          if (isStrategyMatching) {
            await this.registerBet(strategyName, strategy);
            break;
          }
        }
      }

      if (this.state.gameState && this.validateChipSize(this.state.gameState)) {
        this.state.backupGameState();
        this.state.setNextBetSize(this.config.chipSize);
        await this.submitBets();
      }

      this.state.gameStage = GameStage.WAIT;
    }
  }

  isMatchingStrategy(
    triggers: RouletteTriggers,
    numberHistory: number[],
    lastBetStrategy: string,
    lastGameSuspended: boolean
  ): boolean {
    let patternMatching = false;
    let percentageMatching = false;
    let suspendedMatching = false;

    if (triggers.parent && triggers.parent.includes(lastBetStrategy)) {
      suspendedMatching = true;
    }

    if (lastGameSuspended !== suspendedMatching) {
      return false;
    }

    if (this.isPatternMatching(triggers.pattern, numberHistory)) {
      patternMatching = true;
    }

    if (this.isPercentageMatching(triggers.distribution, numberHistory)) {
      percentageMatching = true;
    }

    return patternMatching && percentageMatching;
  }

  async registerBet(
    strategyName: string,
    strategy: RouletteStrategy
  ): Promise<void> {
    this.logMessage(`strategy matched - ${strategyName}`);

    const tableName = this.driver.getTableName();
    const { success, state } = await this.postBetInit(strategyName, tableName);

    if (success) {
      this.logMessage("server accepted bet");
      this.state.setupGameState(strategy, state.betStrategy, state.suspended);
    } else {
      this.logMessage("server refused bet");
    }
  }

  runStageWait(dealerMessage: TableMessage): void {
    this.logMessage("waiting for next round");

    const currentBetSize = this.state.gameState?.betSize ?? 0;

    const expectedMessage =
      !this.config.dryRun && currentBetSize > 0
        ? TableMessage.EMPTY
        : TableMessage.WAIT;

    if (dealerMessage === expectedMessage) {
      if (this.state.gameState) {
        this.state.gameStage = GameStage.RESULTS;
      } else {
        this.state.gameStage = GameStage.BET;
      }
    }
  }

  async runStageResult(dealerMessage: TableMessage): Promise<void> {
    this.logMessage("waiting for result");

    if ([TableMessage.BETS, TableMessage.LAST_BETS].includes(dealerMessage)) {
      this.logMessage("processing results");

      const lastNumber = this.driver.getLastNumber();

      if (isNaN(lastNumber)) {
        this.state.restoreGameState();
        this.driver.closeMessages();
      } else if (this.state.gameState) {
        const tableName = this.driver.getTableName();
        const winTypes = this.getWinTypes(lastNumber);

        const stopLossLimit = this.state.gameStrategy?.limits?.stopLoss ?? 0;

        const suspendLossLimit =
          this.state.gameStrategy?.limits?.suspendLoss ?? 0;

        let isWin = false;

        this.state.gameStrategy.bets.forEach((betName: string) => {
          isWin = isWin || winTypes.includes(betName);
        });

        if (isWin) {
          await this.resultWinHandler(tableName);
        } else if (suspendLossLimit > 0) {
          const isSuspendLossReached =
            this.state.gameState.betProgression === suspendLossLimit;

          await this.resultSuspendLossHandler(isSuspendLossReached, tableName);
        } else if (stopLossLimit > 0) {
          const isStopLossReached =
            this.state.gameState.betProgression === stopLossLimit;

          await this.resultStopLossHandler(isStopLossReached, tableName);
        }
      }

      this.state.gameStage = GameStage.BET;
    }
  }

  async resultWinHandler(tableName: string): Promise<void> {
    this.calculateWinProfit();

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

  calculateWinProfit(): void {
    const betType = this.state.gameStrategy.bets[0];

    const lastBetProfit =
      roulettePayout[betType] * this.state.gameState.betSize;

    this.state.gameState.profit += lastBetProfit;

    this.state.gameState.profit = parseFloat(
      this.state.gameState.profit.toFixed(2)
    );
  }

  async submitBets(): Promise<void> {
    this.logMessage(`bet strategy: ${this.state.gameState.betStrategy}`);

    let totalBetSize = 0;

    await this.driver.sleep(2000);

    !this.config.dryRun && this.driver.setChipSize(this.config.chipSize);

    for (const betName of this.state.gameStrategy.bets) {
      const clickTimes = Math.round(
        this.state.gameState.betSize / this.config.chipSize
      );

      for (let step = 0; step < clickTimes; step++) {
        !this.config.dryRun && this.driver.setBet(betName);
        totalBetSize += this.config.chipSize.valueOf();
      }
    }

    if (totalBetSize > 0) {
      await this.postBetLog({
        tableName: this.driver.getTableName(),
        betSize: this.state.gameState.betSize,
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
    config: RouletteTriggerDistribution[],
    numberHistory: number[]
  ): boolean {
    let success = true;

    for (const distribution of config) {
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
    const betSize = state?.betSize ?? 0;

    if (betSize === 0) {
      return true;
    }

    let betSizeTemp = betSize.valueOf();
    let smallestChipSize = this.driver.getChipSizes()[0];

    while (smallestChipSize < 0) {
      betSizeTemp = betSizeTemp * 10;
      smallestChipSize = smallestChipSize * 10;
    }

    const remainder = Math.round(betSizeTemp % smallestChipSize);
    return smallestChipSize <= betSizeTemp && remainder === 0;
  }

  isPatternMatching(pattern: string[], lastNumbers: number[]): boolean {
    for (const i in pattern) {
      const betPattern = pattern[i];
      const resultNumber = lastNumbers[i];
      const resultWinTypes = this.getWinTypes(resultNumber);

      if (!resultWinTypes.includes(betPattern)) {
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
