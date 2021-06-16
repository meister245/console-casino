import { serverUrl } from "./constants";
import {
  BetRequestAction,
  BetRequestProps,
  BetRequestResponse,
  GameResult,
  GameState,
  RouletteBotConfig,
  ServerState,
  TableRequestResponse,
} from "./types";

export class RESTClient {
  async getConfig(): Promise<RouletteBotConfig> {
    return fetch(`${serverUrl}/config/`)
      .then((resp) => resp.json())
      .catch((err) => console.error(err));
  }

  async postTable(): Promise<TableRequestResponse> {
    return fetch(`${serverUrl}/table/`, {
      method: "POST",
      mode: "cors",
    })
      .then((resp) => resp.json())
      .catch((err) => console.error(err));
  }

  async deleteTable(tableName: string): Promise<TableRequestResponse> {
    return fetch(`${serverUrl}/table/`, {
      method: "DELETE",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableName }),
    })
      .then((resp) => resp.json())
      .catch((err) => console.error(err));
  }

  async getServerState(tableName: string): Promise<ServerState> {
    const source = tableName.replace(/\s/, "-").toLowerCase();

    return fetch(`${serverUrl}/state/?tableName=${source}`)
      .then((resp) => resp.json())
      .catch((err) => console.error(err));
  }

  async postBet(
    tableName: string,
    data: BetRequestProps
  ): Promise<BetRequestResponse> {
    return fetch(`${serverUrl}/bet/?tableName=${tableName}`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((resp) => resp.json())
      .catch((err) => console.error(err));
  }

  async postBetInit(
    betStrategy: string,
    tableName: string
  ): Promise<BetRequestResponse> {
    return await this.postBet(tableName, {
      action: BetRequestAction.INIT,
      betStrategy,
      tableName,
    });
  }

  async postBetUpdate(
    betSize: number,
    tableName: string
  ): Promise<BetRequestResponse> {
    return await this.postBet(tableName, {
      action: BetRequestAction.UPDATE,
      betSize,
      tableName,
    });
  }

  async postBetSuspend(
    betSize: number,
    betStrategy: string,
    tableName: string
  ): Promise<BetRequestResponse> {
    return await this.postBet(tableName, {
      action: BetRequestAction.SUSPEND,
      betSize,
      betStrategy,
      tableName,
    });
  }

  async postBetReset(
    gameResult: GameResult,
    gameState: GameState,
    tableName: string
  ): Promise<BetRequestResponse> {
    return await this.postBet(tableName, {
      action: BetRequestAction.RESET,
      tableName,
      betResult: gameResult,
      betStrategy: gameState?.betStrategy,
      betMultiplier: gameState?.progressionCount,
    });
  }
}
