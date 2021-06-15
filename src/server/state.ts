import { getConfig } from "./config";
import { ServerState } from "./types";

export const serverState: ServerState = {
  tables: [],
  active: false,
  suspended: false,
  betSize: undefined,
  betStrategy: undefined,
  tableName: undefined,
};

export const assignTable = (): string | null => {
  const { config } = getConfig();

  for (const tableName of config.tables) {
    if (!serverState.tables.includes(tableName)) {
      serverState.tables.push(tableName);
      return tableName;
    }
  }

  return null;
};

export const removeTable = (tableName: string): void => {
  if (serverState.tables.includes(tableName)) {
    serverState.tables = serverState.tables.filter(
      (item) => item !== tableName
    );
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
