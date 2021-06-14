import { getConfig } from "./config";

import { ServerState, GameState } from "./types";

let tables: string[] = [];

const serverState: ServerState = {
  active: false,
  suspended: false,
  betSize: undefined,
  betStrategy: undefined,
  tableName: undefined,
};

export const getState = (): GameState => {
  return {
    tables,
    serverState,
  };
};

export const assignTable = (): string | null => {
  const { config } = getConfig();

  for (const tableName of config.tables) {
    if (!tables.includes(tableName)) {
      tables.push(tableName);
      return tableName;
    }
  }

  return null;
};

export const removeTable = (tableName: string): void => {
  if (tables.includes(tableName)) {
    tables = tables.filter((item) => item !== tableName);
  }
};

export const resetServerState = (): void => {
  serverState.active = false;
  serverState.suspended = false;
  serverState.betSize = undefined;
  serverState.betStrategy = undefined;
  serverState.tableName = undefined;
};

export const initServerState = (
  strategyName: string,
  tableName: string
): void => {
  serverState.active = true;
  serverState.suspended = false;
  serverState.betStrategy = strategyName;
  serverState.tableName = tableName;
};

export const updateServerState = (betSize: number): void => {
  serverState.betSize = betSize;
};

export const suspendServerState = (
  betSize: number,
  betStrategy: string
): void => {
  serverState.active = false;
  serverState.suspended = true;
  serverState.betSize = betSize;
  serverState.betStrategy = betStrategy;
  serverState.tableName = undefined;
};

export const resumeSuspendedServerState = (
  strategyName: string,
  tableName: string
): void => {
  serverState.active = true;
  serverState.suspended = true;
  serverState.betStrategy = strategyName;
  serverState.tableName = tableName;
};
