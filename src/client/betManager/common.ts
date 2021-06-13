import { serverUrl } from "../constants";
import { Playtech } from "../driver/playtech";

import {
  BetRequestProps,
  BetRequestAction,
  ServerState,
  BetRequestResponse,
  GameResult,
  GameState,
} from "../types";

export class BetManager {
  driver: Playtech;

  constructor(driver: Playtech) {
    this.driver = driver;
  }

  async getServerState(): Promise<ServerState> {
    const tableName = this.driver.getTableName();
    const source = tableName.replace(/\s/, "-").toLowerCase();

    return fetch(`${serverUrl}/state/?tableName=${source}`)
      .then((resp) => resp.json())
      .catch((err) => console.error(err));
  }

  async betRequest(data: BetRequestProps): Promise<BetRequestResponse> {
    const tableName = this.driver.getTableName();

    return fetch(`${serverUrl}/bet/?tableName=${tableName}`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((resp) => resp.json())
      .catch((err) => console.error(err));
  }

  async betInit(
    betStrategy: string,
    tableName: string
  ): Promise<BetRequestResponse> {
    return await this.betRequest({
      action: BetRequestAction.INIT,
      betStrategy,
      tableName,
    });
  }

  async betUpdate(
    betSize: number,
    tableName: string
  ): Promise<BetRequestResponse> {
    return await this.betRequest({
      action: BetRequestAction.UPDATE,
      betSize,
      tableName,
    });
  }

  async betSuspend(
    betSize: number,
    betStrategy: string,
    tableName: string
  ): Promise<BetRequestResponse> {
    return await this.betRequest({
      action: BetRequestAction.SUSPEND,
      betSize,
      betStrategy,
      tableName,
    });
  }

  async betReset(
    gameResult: GameResult,
    gameState: GameState,
    tableName: string
  ): Promise<BetRequestResponse> {
    return await this.betRequest({
      action: BetRequestAction.RESET,
      tableName,
      betResult: gameResult,
      betStrategy: gameState?.betStrategy,
      betMultiplier: gameState?.progressionCount,
    });
  }
}
