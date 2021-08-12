import fetch from "cross-fetch";

import { serverUrl } from "../constants";
import {
  GameResult,
  RouletteBetSize,
  RouletteBotConfig,
  ServerGameState,
  ServerState,
  ServerStats,
} from "./../types";
import { GameState } from "./state";

export enum BetRequestAction {
  INIT = "init",
  UPDATE = "update",
  SUSPEND = "suspend",
  RESET = "reset",
}

interface TableRequestResponse {
  success: boolean;
  tableRegex?: string;
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
  betSize?: RouletteBetSize;
  profit?: number;
  tableName?: string;
}

interface BetRequestResponse {
  success: boolean;
  state: ServerGameState;
}

interface BetLogRequestResponse {
  success: boolean;
}

const wait = (delay: number) => {
  return new Promise((resolve) => setTimeout(resolve, delay));
};

class RESTClient {
  async getConfig(retryTimes = 3): Promise<RouletteBotConfig> {
    const onError = async (err: Error) => {
      console.log(err);

      if (retryTimes === 0) {
        throw err;
      }

      return wait(1000).then(() => this.getConfig(retryTimes - 1));
    };

    return fetch(`${serverUrl}/config/`)
      .then((resp) => resp.json())
      .catch(onError);
  }

  async postTableAssign(retryTimes = 3): Promise<TableRequestResponse> {
    const onError = async (err: Error) => {
      console.log(err);

      if (retryTimes === 0) {
        throw err;
      }

      return wait(1000).then(() => this.postTableAssign(retryTimes - 1));
    };

    return fetch(`${serverUrl}/table/`, {
      method: "POST",
      mode: "cors",
    })
      .then((resp) => resp.json())
      .catch(onError);
  }

  async postTableBacktest(
    tableName: string,
    numbers: number[],
    retryTimes = 3
  ): Promise<TableRequestResponse> {
    const onError = async (err: Error) => {
      console.log(err);

      if (retryTimes === 0) {
        throw err;
      }

      return wait(1000).then(() => this.postTableAssign(retryTimes - 1));
    };

    return fetch(`${serverUrl}/table/backtest/`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableName, numbers }),
    })
      .then((resp) => resp.json())
      .catch(onError);
  }

  async deleteTable(
    tableName: string,
    retryTimes = 3
  ): Promise<TableRequestResponse> {
    const onError = async (err: Error) => {
      console.log(err);

      if (retryTimes === 0) {
        throw err;
      }

      return wait(1000).then(() => this.deleteTable(tableName, retryTimes - 1));
    };

    return fetch(`${serverUrl}/table/`, {
      method: "DELETE",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableName }),
    })
      .then((resp) => resp.json())
      .catch(onError);
  }

  async getServerState(
    tableName: string,
    retryTimes = 3
  ): Promise<ServerState> {
    const source = tableName.replace(/\s/, "-").toLowerCase();

    const onError = async (err: Error) => {
      console.log(err);

      if (retryTimes === 0) {
        throw err;
      }

      return wait(150).then(() =>
        this.getServerState(tableName, retryTimes - 1)
      );
    };

    return fetch(`${serverUrl}/state/?tableName=${source}`)
      .then((resp) => resp.json())
      .catch(onError);
  }

  async getServerStats(retryTimes = 3): Promise<ServerStats> {
    const onError = async (err: Error) => {
      console.log(err);

      if (retryTimes === 0) {
        throw err;
      }

      return wait(150).then(() => this.getServerStats(retryTimes - 1));
    };

    return fetch(`${serverUrl}/stats/`)
      .then((resp) => resp.json())
      .catch(onError);
  }

  async deleteServerState(retryTimes = 3): Promise<ServerState> {
    const onError = async (err: Error) => {
      console.log(err);

      if (retryTimes === 0) {
        throw err;
      }

      return wait(150).then(() => this.deleteServerState(retryTimes - 1));
    };

    return fetch(`${serverUrl}/state/reset/`, {
      method: "DELETE",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
    })
      .then((resp) => resp.json())
      .catch(onError);
  }

  async postBet(
    tableName: string,
    data: BetRequestProps,
    retryTimes = 3
  ): Promise<BetRequestResponse> {
    const onError = async (err: Error) => {
      console.log(err);

      if (retryTimes === 0) {
        throw err;
      }

      return wait(150).then(() =>
        this.postBet(tableName, data, retryTimes - 1)
      );
    };

    return fetch(`${serverUrl}/bet/?tableName=${tableName}`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((resp) => resp.json())
      .catch(onError);
  }

  postBetInit(
    betStrategy: string,
    tableName: string
  ): Promise<BetRequestResponse> {
    return this.postBet(tableName, {
      action: BetRequestAction.INIT,
      betStrategy,
      tableName,
    });
  }

  postBetUpdate(
    betSize: RouletteBetSize,
    betProgression: number,
    tableName: string
  ): Promise<BetRequestResponse> {
    return this.postBet(tableName, {
      action: BetRequestAction.UPDATE,
      betSize,
      betProgression,
      tableName,
    });
  }

  postBetSuspend(
    betSize: RouletteBetSize,
    betStrategy: string,
    tableName: string
  ): Promise<BetRequestResponse> {
    return this.postBet(tableName, {
      action: BetRequestAction.SUSPEND,
      betSize,
      betStrategy,
      tableName,
    });
  }

  postBetReset(
    gameResult: GameResult,
    gameState: GameState,
    tableName: string
  ): Promise<BetRequestResponse> {
    return this.postBet(tableName, {
      action: BetRequestAction.RESET,
      tableName,
      profit: gameState?.profit,
      betResult: gameResult,
      betStrategy: gameState?.betStrategy,
      betProgression: gameState?.betProgression,
    });
  }

  async postBetLog(
    data: BetLogRequestProps,
    retryTimes = 3
  ): Promise<BetLogRequestResponse> {
    const onError = async (err: Error) => {
      console.log(err);

      if (retryTimes === 0) {
        throw err;
      }

      return wait(250).then(() => this.postBetLog(data, retryTimes - 1));
    };

    return fetch(`${serverUrl}/bet/log/`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((resp) => resp.json())
      .catch(onError);
  }
}

export default RESTClient;
