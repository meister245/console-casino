import { RouletteConfig } from "./../types";

export interface ServerGameState {
  running: boolean;
  active: boolean;
  suspended: boolean;
  betSize?: number;
  betProgression?: number;
  betStrategy?: string;
  tableName?: string;
}

export type ServerState = ServerGameState & {
  tables: string[];
};

class State implements ServerState {
  tables: string[];
  running: boolean;
  active: boolean;
  suspended: boolean;
  betSize?: number;
  betProgression?: number;
  betStrategy?: string;
  tableName?: string;

  constructor() {
    this.tables = [];
    this.running = true;
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
      running: this.running,
      active: this.active,
      suspended: this.suspended,
      betSize: this.betSize,
      betProgression: this.betProgression,
      betStrategy: this.betStrategy,
      tableName: this.tableName,
    };
  }

  stopRunning(): void {
    this.running = false;
  }

  assignTable(config: RouletteConfig): string | null {
    for (const tableRegex of config.tableRegex) {
      if (!this.tables.includes(tableRegex)) {
        this.tables.push(tableRegex);
        return tableRegex;
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
    this.betProgression = undefined;
    this.tableName = undefined;
  }

  initGameState(strategyName: string, tableName: string): void {
    this.active = true;
    this.suspended = false;
    this.betStrategy = strategyName;
    this.tableName = tableName;
  }

  updateGameState(betSize: number, betProgression: number): void {
    this.betSize = betSize;
    this.betProgression = betProgression;
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
