import { RouletteBetSize, RouletteStrategy } from "../types";

export enum GameStage {
  BET = "stage-bet",
  WAIT = "stage-wait",
  RESULTS = "stage-results",
  SETUP = "stage-setup",
}

export interface GameState {
  betSize: RouletteBetSize;
  betStrategy: string;
  betProgression: number;
  suspended: boolean;
  profit: number | null;
}

class ClientState {
  gameStage: GameStage;
  gameState: GameState | null;
  gameStrategy: RouletteStrategy | null;

  private lastGameState: GameState | null;

  constructor() {
    this.gameStage = GameStage.SETUP;
    this.gameState = null;
    this.gameStrategy = null;

    this.lastGameState = null;
  }

  setupGameState(
    strategy: RouletteStrategy,
    strategyName: string,
    suspended: boolean
  ): void {
    this.gameStrategy = strategy;
    this.gameState = {
      betSize: {} as RouletteBetSize,
      betStrategy: strategyName,
      suspended: suspended,
      betProgression: 1,
      profit: 0,
    };
  }

  getBetSizeTotal(): number {
    return Object.values(this.gameState.betSize).reduce((a, b) => a + b, 0);
  }

  setNextBetSize(): void {
    const nextProgressionUnit =
      this.gameStrategy.progression[this.gameState.betProgression - 1];

    for (const betConfig of this.gameStrategy.bets) {
      const betSize = betConfig.chipSize * nextProgressionUnit;

      this.gameState.betSize[betConfig.betType] = parseFloat(
        betSize.toFixed(2)
      );
    }
  }

  setNextBetProgression(): void {
    this.gameState.betProgression += 1;
  }

  setGameStage(stage: GameStage): void {
    this.gameStage = stage;
  }

  resetGameState(): void {
    this.lastGameState = null;
    this.gameState = null;
    this.gameStrategy = null;
  }

  backupGameState(): void {
    this.lastGameState = JSON.parse(JSON.stringify(this.gameState));
  }

  restoreGameState(): void {
    this.gameState = JSON.parse(JSON.stringify(this.lastGameState));
    this.lastGameState = null;
  }
}

export default ClientState;
