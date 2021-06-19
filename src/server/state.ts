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

class State implements ServerGameState {
  tables: string[];
  active: boolean;
  suspended: boolean;
  betSize?: number;
  betStrategy?: string;
  tableName?: string;

  constructor() {
    this.tables = [];
    this.active = false;
    this.suspended = false;
  }

  getServerState(): ServerState {
    return {
      ...this.getGameState(),
      tables: this.tables,
    };
  }

  getGameState(): ServerGameState {
    return {
      active: this.active,
      suspended: this.suspended,
      betSize: this.betSize,
      betStrategy: this.betStrategy,
      tableName: this.tableName,
    };
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
    this.active = false;
    this.suspended = false;
    this.betSize = undefined;
    this.betStrategy = undefined;
    this.tableName = undefined;
  }

  initGameState(strategyName: string, tableName: string): void {
    this.active = true;
    this.suspended = false;
    this.betStrategy = strategyName;
    this.tableName = tableName;
  }

  updateGameState(betSize: number): void {
    this.betSize = betSize;
  }

  suspendGameState(betSize: number, betStrategy: string): void {
    this.active = false;
    this.suspended = true;
    this.betSize = betSize;
    this.betStrategy = betStrategy;
    this.tableName = undefined;
  }

  resumeSuspendedGameState(strategyName: string, tableName: string): void {
    this.active = true;
    this.suspended = true;
    this.betStrategy = strategyName;
    this.tableName = tableName;
  }
}

export default State;
