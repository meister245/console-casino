import { serverUrl } from "../constants";
import {
  GameResult,
  RouletteBotConfig,
  ServerGameState,
  ServerState,
} from "./../types";
import { GameState } from "./betManager/roulette";

export enum BetRequestAction {
  INIT = "init",
  UPDATE = "update",
  SUSPEND = "suspend",
  RESET = "reset",
}

interface TableRequestResponse {
  success: boolean;
  tableName?: string;
}

interface BetLogRequestProps {
  betStrategy: string;
  betSize: number;
  tableName: string;
}

interface BetRequestProps {
  action: BetRequestAction;
  betStrategy?: string;
  betProgression?: number;
  betResult?: GameResult;
  betSize?: number;
  tableName?: string;
}

interface BetRequestResponse {
  success: boolean;
  state: ServerGameState;
}

interface BetLogRequestResponse {
  success: boolean;
}

export class RESTClient {
  async getConfig(): Promise<RouletteBotConfig> {
    return fetch(`${serverUrl}/config/`)
      .then((resp) => resp.json())
      .catch((err) => console.error(err));
  }

  async postTableAssign(): Promise<TableRequestResponse> {
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
      betProgression: gameState?.progressionCount,
    });
  }

  async postBetLog(data: BetLogRequestProps): Promise<BetLogRequestResponse> {
    return fetch(`${serverUrl}/bet/log/`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((resp) => resp.json())
      .catch((err) => console.error(err));
  }
}
