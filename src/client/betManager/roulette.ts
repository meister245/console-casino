import {
  lostGameUrl,
  rouletteNumbers,
  tableInactiveMessageRegex,
} from "../constants";
import { Playtech } from "../driver/playtech";
import { RESTClient } from "../rest";
import {
  ClientState,
  GameResult,
  GameStage,
  GameState,
  RouletteConfig,
  RouletteNumbers,
  RouletteStrategies,
  RouletteStrategy,
  RouletteTriggers,
  ServerGameState,
  TableMessage,
} from "../types";

export class RouletteBetManager extends RESTClient {
  private driver: Playtech;
  private config: RouletteConfig;
  private lastBetTime: number;
  private lastLogMessage: null | string;
  private running: boolean;
  private state: ClientState;
  private strategies: RouletteStrategies;

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

    this.lastBetTime = Math.floor(Date.now() / 1000);
    this.lastLogMessage = null;

    this.state = {
      gameState: null,
      gameStage: GameStage.SPIN,
    };
  }

  isActive(): boolean {
    return this.running;
  }

  updateLastBetTime(): void {
    this.lastBetTime = Math.floor(Date.now() / 1000);
  }

  async reload(tableName: string): Promise<void> {
    this.running = false;
    await this.deleteTable(tableName);
    window.location.href = this.config.lobbyUrl;
  }

  validateBetActivity(): boolean {
    let result = true;

    if (!this.state.gameState) {
      const timeDiff = Math.floor(Date.now() / 1000) - this.lastBetTime;

      if (timeDiff > 60 * 20) {
        result = false;
      }
    }

    return result;
  }

  async runStage(): Promise<void> {
    const modalMessage = this.driver.getModalMessage().toLowerCase();

    if (modalMessage && modalMessage.match(tableInactiveMessageRegex)) {
      const tableName = this.driver.getTableName();

      if (this.state.gameState) {
        await this.postBetReset(
          GameResult.ABORT,
          this.state.gameState,
          tableName
        );
      }

      await this.reload(tableName);
    }

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
      this.state.gameState = this.setupGameState(strategy, state);
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

      if (this.state.gameState) {
        const tableName = this.driver.getTableName();
        const winTypes = this.getWinTypes(lastNumber);
        const strategy = this.strategies[this.state.gameState.betStrategy];

        const isSuspendLossReached =
          this.state.gameState.suspendLossLimit !== 0 &&
          this.state.gameState.progressionCount ===
            this.state.gameState.suspendLossLimit;

        const isStopLossReached =
          this.state.gameState.stopLossLimit !== 0 &&
          this.state.gameState.progressionCount ===
            this.state.gameState.stopLossLimit;

        let isWin = false;

        strategy.bets.forEach((betName: string) => {
          isWin = isWin || winTypes.includes(betName);
        });

        if (isWin) {
          const { success } = await this.postBetReset(
            GameResult.WIN,
            this.state.gameState,
            tableName
          );
          success && this.logMessage("registered win, reset server state");

          this.state.gameState = null;
        } else if (this.state.gameState.suspendLossLimit > 0) {
          this.state.gameState.betSize =
            this.state.gameState.betSize *
            this.state.gameState.progressionMultiplier;

          if (!isSuspendLossReached) {
            const { success } = await this.postBetUpdate(
              this.state.gameState.betSize,
              tableName
            );
            success &&
              this.logMessage("updated bet size, updated server state");
            this.state.gameState.progressionCount += 1;
          } else if (isSuspendLossReached) {
            const { success } = await this.postBetSuspend(
              this.state.gameState.betSize,
              this.state.gameState.betStrategy,
              tableName
            );
            success &&
              this.logMessage("suspend limit reached, reset server state");
            this.state.gameState = null;
          }
        } else if (this.state.gameState.stopLossLimit > 0) {
          this.state.gameState.betSize =
            this.state.gameState.betSize *
            this.state.gameState.progressionMultiplier;

          if (!isStopLossReached) {
            const { success } = await this.postBetUpdate(
              this.state.gameState.betSize,
              tableName
            );
            success &&
              this.logMessage("updated bet size, updated server state");
            this.state.gameState.progressionCount += 1;
          } else if (isStopLossReached) {
            const { success } = await this.postBetReset(
              GameResult.LOSE,
              this.state.gameState,
              tableName
            );
            success && this.logMessage("registered loss, reset server state");
            this.state.gameState = null;
            window.location.href = lostGameUrl;
          }
        }
      }

      this.state.gameStage = GameStage.BET;
    }
  }

  async submitBets(): Promise<void> {
    this.logMessage(`bet strategy: ${this.state.gameState.betStrategy}`);

    let totalBetSize = 0;

    await this.driver.sleep(2000);

    !this.config.dryRun && this.driver.setChipSize(this.config.chipSize);

    for (const betName of this.state.gameState.bets) {
      const clickTimes = Math.floor(
        this.state.gameState.betSize / this.config.chipSize
      );

      for (let step = 0; step < clickTimes; step++) {
        !this.config.dryRun && this.driver.setBet(betName);
        totalBetSize += this.config.chipSize.valueOf();
      }
    }

    !this.config.dryRun && this.updateLastBetTime();

    this.logMessage(`bets: ${this.state.gameState.bets}`);
    this.logMessage(`total: ${totalBetSize.toFixed(2)}`);
  }

  isPercentageMatching(
    config: (string | number)[],
    numberHistory: number[]
  ): boolean {
    const sampleBet = config[0] as string;
    const sampleSize = config[1] as number;
    const percentageTarget = config[2] as number;
    const percentageOperator = config[3] as string;

    const betNumbers = rouletteNumbers[sampleBet as keyof RouletteNumbers];
    const sampleNumberSet = numberHistory.slice(0, sampleSize);

    let occurrence = 0;

    sampleNumberSet.forEach((n) => {
      if (betNumbers.includes(n)) {
        occurrence = occurrence + 1;
      }
    });

    const percentage = Math.floor((occurrence / sampleNumberSet.length) * 100);

    switch (percentageOperator) {
      case "lowerEqual":
        return percentage <= percentageTarget;
      case "equal":
        return percentage === percentageTarget;
      case "higherEqual":
        return percentage >= percentageTarget;
      default:
        return false;
    }
  }

  validateChipSize(state: ServerGameState | GameState): boolean {
    const smallestChipSize = this.driver.getChipSizes()[0];
    const betSize = state?.betSize ?? this.config.chipSize;
    return smallestChipSize <= betSize && betSize % smallestChipSize === 0;
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
  ): GameState {
    return {
      bets: strategy.bets,
      betSize: serverState.betSize
        ? serverState.betSize
        : this.config.chipSize.valueOf(),
      betStrategy: serverState.betStrategy,
      suspended: serverState.suspended,
      progressionCount: 1,
      progressionMultiplier: strategy.progressionMultiplier,
      stopWinLimit: strategy.limits?.stopWin ?? 0,
      stopLossLimit: strategy.limits?.stopLoss ?? 0,
      suspendLossLimit: strategy.limits?.suspendLoss ?? 0,
    };
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
