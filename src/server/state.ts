import { getConfig } from "./config";

export interface ServerGameState {
  active: boolean;
  suspended: boolean;
  betSize?: number;
  betStrategy?: string;
  tableName?: string;
}

export type ServerState = ServerGameState & {
  tables: string[];
};

class State {
  tables: string[];
  gameState: ServerGameState;

  constructor() {
    this.tables = [];

    this.gameState = {
      active: false,
      suspended: false,
    };
  }

  getServerState(): ServerState {
    return {
      ...this.gameState,
      tables: this.tables,
    };
  }

  getGameState(): ServerGameState {
    return this.gameState;
  }

  assignTable(): string | null {
    const { config } = getConfig();

    for (const tableName of config.tables) {
      if (!this.tables.includes(tableName)) {
        this.tables.push(tableName);
        return tableName;
      }
    }

    return null;
  }

  removeTable(tableName: string): void {
    this.tables = this.tables.filter((item) => item !== tableName);
  }

  resetGameState(): void {
    this.gameState.active = false;
    this.gameState.suspended = false;
    this.gameState.betSize = undefined;
    this.gameState.betStrategy = undefined;
    this.gameState.tableName = undefined;
  }

  initGameState(strategyName: string, tableName: string): void {
    this.gameState.active = true;
    this.gameState.suspended = false;
    this.gameState.betStrategy = strategyName;
    this.gameState.tableName = tableName;
  }

  updateGameState(betSize: number): void {
    this.gameState.betSize = betSize;
  }

  suspendGameState(betSize: number, betStrategy: string): void {
    this.gameState.active = false;
    this.gameState.suspended = true;
    this.gameState.betSize = betSize;
    this.gameState.betStrategy = betStrategy;
    this.gameState.tableName = undefined;
  }

  resumeSuspendedGameState(strategyName: string, tableName: string): void {
    this.gameState.active = true;
    this.gameState.suspended = true;
    this.gameState.betStrategy = strategyName;
    this.gameState.tableName = tableName;
  }
}

export default State;
