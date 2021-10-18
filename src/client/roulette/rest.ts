import fetch from "cross-fetch";

import { serverUrl } from "../constants";

type RequestResponse = {
  success: boolean;
};

type RequestParams = {
  tableName: string;
};

type RequestStateSetupParams = {
  numbers: number[];
  chipSize: number[];
} & RequestParams;

type RequestStateUpdateParams = {
  number: number;
  balance: number;
} & RequestParams;

type RequestStateBetParams = {
  bets: never;
} & RequestParams;

type RequestStateUpdateResponse = {
  bets?: never;
  clicks?: never;
  chipSize?: never;
  strategyName?: string;
} & RequestResponse;

type RequestTableAssignResponse = {
  dryRun: boolean;
  resetUrl?: string;
  tableName?: string;
  leaseTime?: number;
} & RequestResponse;

type RequestTableExtendResponse = {
  leaseTime: number;
} & RequestResponse;

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

class RESTClient {
  async postStateSetup(
    params: RequestStateSetupParams,
    retryTimes = 3
  ): Promise<RequestResponse> {
    const onError = async (err: Error) => {
      console.log(err);

      if (retryTimes === 0) {
        throw err;
      }

      return sleep(1000).then(() =>
        this.postStateSetup(params, retryTimes - 1)
      );
    };

    return fetch(`${serverUrl}/state/setup/`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
      .then((resp) => resp.json())
      .catch(onError);
  }

  async postStateUpdate(
    params: RequestStateUpdateParams,
    retryTimes = 3
  ): Promise<RequestStateUpdateResponse> {
    const onError = async (err: Error) => {
      console.log(err);

      if (retryTimes === 0) {
        throw err;
      }

      return sleep(1000).then(() =>
        this.postStateUpdate(params, retryTimes - 1)
      );
    };

    return fetch(`${serverUrl}/state/update/`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
      .then((resp) => resp.json())
      .catch(onError);
  }

  async postStateBet(
    params: RequestStateBetParams,
    retryTimes = 3
  ): Promise<RequestResponse> {
    const onError = async (err: Error) => {
      console.log(err);

      if (retryTimes === 0) {
        throw err;
      }

      return sleep(250).then(() => this.postStateBet(params, retryTimes - 1));
    };

    return fetch(`${serverUrl}/state/bet/`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
      .then((resp) => resp.json())
      .catch(onError);
  }

  async postTableAssign(retryTimes = 3): Promise<RequestTableAssignResponse> {
    const onError = async (err: Error) => {
      console.log(err);

      if (retryTimes === 0) {
        throw err;
      }

      return sleep(1000).then(() => this.postTableAssign(retryTimes - 1));
    };

    return fetch(`${serverUrl}/table/assign/`, {
      method: "POST",
      mode: "cors",
    })
      .then((resp) => resp.json())
      .catch(onError);
  }

  async postTableExtend(
    params: RequestParams,
    retryTimes = 3
  ): Promise<RequestTableExtendResponse> {
    const onError = async (err: Error) => {
      console.log(err);

      if (retryTimes === 0) {
        throw err;
      }

      return sleep(1000).then(() => this.postTableAssign(retryTimes - 1));
    };

    return fetch(`${serverUrl}/table/extend/`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
      .then((resp) => resp.json())
      .catch(onError);
  }

  async deleteTableRelease(
    params: RequestParams,
    retryTimes = 3
  ): Promise<RequestResponse> {
    const onError = async (err: Error) => {
      console.log(err);

      if (retryTimes === 0) {
        throw err;
      }

      return sleep(1000).then(() =>
        this.deleteTableRelease(params, retryTimes - 1)
      );
    };

    return fetch(`${serverUrl}/table/release/`, {
      method: "DELETE",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
      .then((resp) => resp.json())
      .catch(onError);
  }
}

export default RESTClient;
