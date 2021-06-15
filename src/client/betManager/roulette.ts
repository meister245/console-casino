import { lostGameUrl, rouletteNumbers } from "../constants";
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
  ServerState,
  TableMessage,
} from "../types";

const modalMessageRegex =
  /(inactive|disconnected|restart|unavailable|table.will.be.closed)/;

export class RouletteBetManager {
  driver: Playtech;
  restClient: RESTClient;
  config: RouletteConfig;
  strategies: RouletteStrategies;
  lastLogMessage: null | string;
  state: ClientState;

  constructor(
    driver: Playtech,
    restClient: RESTClient,
    config: RouletteConfig,
    strategies: RouletteStrategies
  ) {
    this.config = config;
    this.driver = driver;
    this.restClient = restClient;
    this.strategies = strategies;
    this.lastLogMessage = null;

    this.state = {
      gameState: null,
      gameStage: GameStage.SPIN,
    };
  }

  async start(): Promise<void> {
    const modalMessage = this.driver.getModalMessage().toLowerCase();

    if (modalMessage && modalMessage.match(modalMessageRegex)) {
      const tableName = this.driver.getTableName();

      if (this.state.gameState) {
        await this.restClient.betReset(
          GameResult.ABORT,
          this.state.gameState,
          tableName
        );
      }

      await this.restClient.resetTable(tableName);
      window.location.href = this.config.lobbyUrl;
    }

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

  runStageSpin(dealerMessage: TableMessage): void {
    this.logMessage("waiting for next spin");

    if (dealerMessage === TableMessage.WAIT) {
      this.state.gameStage = GameStage.BET;
    }
  }

  async runStageBet(dealerMessage: TableMessage): Promise<void> {
    this.logMessage("waiting to be able to place bets");

    if ([TableMessage.BETS, TableMessage.LAST_BETS].includes(dealerMessage)) {
      if (this.state.gameState === null) {
        const tableName = this.driver.getTableName();
        const numberHistory = this.driver.getNumberHistory();

        const { suspended: lastGameSuspended, betStrategy: lastBetStrategy } =
          await this.restClient.getServerState(tableName);

        for (const strategyName in this.strategies) {
          const strategy = this.strategies[strategyName];

          const isStrategyMatching = this.isMatchingStrategy(
            strategy.trigger,
            numberHistory,
            lastBetStrategy,
            lastGameSuspended
          );

          if (isStrategyMatching) {
            await this.registerBet(strategyName, strategy);
            break;
          }
        }
      } else {
        this.logMessage(
          `continue betting - ${this.state.gameState.betStrategy}`
        );
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
    const { success, serverState } = await this.restClient.betInit(
      strategyName,
      tableName
    );

    if (success) {
      this.logMessage("server accepted bet");
      this.state.gameState = this.setupGameState(strategy, serverState);

      await this.submitBets();
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
          const { success } = await this.restClient.betReset(
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
            const { success } = await this.restClient.betUpdate(
              this.state.gameState.betSize,
              tableName
            );
            success &&
              this.logMessage("updated bet size, updated server state");
            this.state.gameState.progressionCount += 1;
          } else if (isSuspendLossReached) {
            const { success } = await this.restClient.betSuspend(
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
            const { success } = await this.restClient.betUpdate(
              this.state.gameState.betSize,
              tableName
            );
            success &&
              this.logMessage("updated bet size, updated server state");
            this.state.gameState.progressionCount += 1;
          } else if (isStopLossReached) {
            const { success } = await this.restClient.betReset(
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
        this.logMessage(`click ${betName} ${step + 1}`);
      }
    }

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
    serverState: ServerState
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
