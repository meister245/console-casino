import {
  messageRegexInactive,
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
import { Playtech } from "../driver/playtech";
import { RESTClient } from "../rest";

enum TableMessage {
  WAIT = "wait for the next round",
  BETS = "place your bets",
  LAST_BETS = "last bets",
  EMPTY = "",
}

enum GameStage {
  BET = "stage-bet",
  SPIN = "stage-spin",
  WAIT = "stage-wait",
  RESULTS = "stage-results",
}

interface ClientState {
  gameStage: GameStage;
  gameState: GameState | null;
  gameStrategy: RouletteStrategy | null;
}

export interface GameState {
  betSize: number;
  betStrategy: string;
  suspended: boolean;
  progressionCount: number;
  profit: number | null;
}

export class RouletteBetManager extends RESTClient {
  private driver: Playtech;
  private config: RouletteConfig;
  private state: ClientState;
  private strategies: RouletteStrategies;

  private running: boolean;
  private initTime: number;
  private lastGameState: GameState | null;
  private lastLogMessage: null | string;

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
    this.initTime = Math.floor(Date.now() / 1000);
    this.lastGameState = null;
    this.lastLogMessage = null;

    this.state = {
      gameState: null,
      gameStrategy: null,
      gameStage: GameStage.SPIN,
    };
  }

  isActive(): boolean {
    return this.running;
  }

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
      const timeDiff = Math.floor(Date.now() / 1000) - this.initTime;

      if (timeDiff > 60 * 20) {
        return true;
      }
    }

    for (const message of this.driver.getMessages()) {
      if (message && message.match(messageRegexInactive)) {
        const tableName = this.driver.getTableName();

        if (this.state.gameState) {
          await this.postBetReset(
            GameResult.ABORT,
            this.state.gameState,
            tableName
          );
        }

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
        this.backupGameState();
        this.setNextBetSize();
        await this.submitBets();
      }

      this.state.gameStage = GameStage.WAIT;
    }
  }

  backupGameState(): void {
    this.lastGameState = JSON.parse(JSON.stringify(this.state.gameState));
  }

  restoreGameState(): void {
    this.state.gameState = JSON.parse(JSON.stringify(this.lastGameState));
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
      this.setupGameState(strategy, state);
    } else {
      this.logMessage("server refused bet");
    }
  }

  runStageWait(dealerMessage: TableMessage): void {
    this.logMessage("waiting for next round");

    const expectedMessage =
      this.config.dryRun || this.state.gameState === null
        ? TableMessage.WAIT
        : TableMessage.EMPTY;

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
        this.restoreGameState();
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
            this.state.gameState.progressionCount === suspendLossLimit;

          await this.resultSuspendLossHandler(isSuspendLossReached, tableName);
        } else if (stopLossLimit > 0) {
          const isStopLossReached =
            this.state.gameState.progressionCount === stopLossLimit;

          await this.resultStopLossHandler(isStopLossReached, tableName);
        }
      }

      this.state.gameStage = GameStage.BET;
    }
  }

  async resultWinHandler(tableName: string): Promise<void> {
    this.calculateWinProfit();
    const { success } = await this.postBetReset(
      GameResult.WIN,
      this.state.gameState,
      tableName
    );
    success && this.logMessage("registered win, reset server state");
    this.resetGameState();
  }

  async resultSuspendLossHandler(
    isSuspendLossReached: boolean,
    tableName: string
  ): Promise<void> {
    if (!isSuspendLossReached) {
      const { success } = await this.postBetUpdate(
        this.state.gameState.betSize,
        tableName
      );
      success && this.logMessage("updated bet size, updated server state");
      this.state.gameState.progressionCount += 1;
    } else if (isSuspendLossReached) {
      const { success } = await this.postBetSuspend(
        this.state.gameState.betSize,
        this.state.gameState.betStrategy,
        tableName
      );
      success && this.logMessage("suspend limit reached, reset server state");
      this.resetGameState();
    }
  }

  async resultStopLossHandler(
    isStopLossReached: boolean,
    tableName: string
  ): Promise<void> {
    if (!isStopLossReached) {
      const { success } = await this.postBetUpdate(
        this.state.gameState.betSize,
        tableName
      );
      success && this.logMessage("updated bet size, updated server state");
      this.state.gameState.progressionCount += 1;
    } else if (isStopLossReached) {
      const { success } = await this.postBetReset(
        GameResult.LOSE,
        this.state.gameState,
        tableName
      );
      success && this.logMessage("registered loss, reset server state");
      this.resetGameState();
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

  setNextBetSize(): void {
    if (
      this.state.gameState.progressionCount === 1 &&
      !this.state.gameState.suspended
    ) {
      return;
    }

    if (this.state.gameStrategy.progressionMultiplier) {
      this.state.gameState.betSize =
        this.state.gameState.betSize *
        this.state.gameStrategy.progressionMultiplier;
    }

    if (this.state.gameStrategy.progressionCustom) {
      this.state.gameState.betSize =
        this.config.chipSize *
        this.state.gameStrategy.progressionCustom[
          this.state.gameState.progressionCount - 1
        ];
    }

    this.state.gameState.betSize = parseFloat(
      this.state.gameState.betSize.toFixed(2)
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

    await this.postBetLog({
      tableName: this.driver.getTableName(),
      betSize: this.state.gameState.betSize,
      betStrategy: this.state.gameState.betStrategy,
    });

    this.state.gameState.profit -= totalBetSize;

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
    const betSize = state?.betSize ?? this.config.chipSize;

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

  setupGameState(
    strategy: RouletteStrategy,
    serverState: ServerGameState
  ): void {
    this.state.gameStrategy = strategy;
    this.state.gameState = {
      betSize: serverState.betSize
        ? serverState.betSize
        : this.config.chipSize.valueOf(),
      betStrategy: serverState.betStrategy,
      suspended: serverState.suspended,
      progressionCount: 1,
      profit: 0,
    };
  }

  resetGameState(): void {
    this.lastGameState = null;
    this.state.gameState = null;
    this.state.gameStrategy = null;
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
