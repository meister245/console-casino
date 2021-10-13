import express = require("express");
import cors = require("cors");

import { NextFunction } from "connect";
import { Request, Response } from "express";

import { fileLogger as logger } from "../common/logger";
import RouletteTableState from "./state";
import RouletteStats from "./stats";
import { RouletteBetSize } from "./types";
import RouletteUtils, { RouletteDriver } from "./util";

export const utils = new RouletteUtils();
export const stats = new RouletteStats();

stats.restoreStats();

export const app = express();

export const config = utils.getConfig();
export const strategies = utils.getStrategies();

const tableNames = [...config.tableNames];
const tableState: { [item: string]: RouletteTableState } = {};

const logRequest = (req: Request, res: Response, done: NextFunction): void => {
  const logMessage = [`${req.method} ${req.url}`];

  if (req.body) {
    logMessage.push(JSON.stringify(req.body));
  }

  logger.info(logMessage.join(" - "));
  done();
};

// workaround for WSL2 network bridge stuck connections
app.use((req, res, next) => {
  res.set("Connection", "close");
  next();
});

app.use(logRequest);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/client/:name", (req, res) => {
  res.set("Content-Type", "application/javascript");

  const clientName = req.params.name as RouletteDriver;
  const client = utils.getClient(clientName);

  res.send(client);
});

app.get("/stats/", (req, res) => {
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify(stats.getStats(), null, 2));
});

app.get("/state/", (req, res) => {
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify(tableState, null, 2));
});

app.post("/state/setup/", (req, res) => {
  res.set("Content-Type", "application/json");

  const { numbers, tableName, chipSize } = {
    numbers: req.body.numbers,
    chipSize: req.body.chipSize,
    tableName: req.body.tableName,
  };

  tableState[tableName] = new RouletteTableState(tableName, numbers, chipSize);

  if (tableName in utils.backtestState) {
    const lastCollectionTime = utils.backtestState[tableName];

    if (lastCollectionTime) {
      const currentTime = Math.floor(Date.now() / 1000);
      const lastCollectionDiff = currentTime - lastCollectionTime;

      if (lastCollectionDiff > 60 * config?.backtestCollectionInterval ?? 240) {
        utils.writeBacktestFile(tableName, numbers);
      }
    }
  } else {
    utils.writeBacktestFile(tableName, numbers);
  }

  res.send(JSON.stringify({ success: true }));
});

app.post("/state/update/", (req, res) => {
  res.set("Content-Type", "application/json");

  const { number, balance, tableName } = {
    number: req.body.number,
    balance: req.body.balance,
    tableName: req.body.tableName,
  };

  const state = tableState[tableName];
  const actions = state.processNumber(stats, number, balance);

  if (!config.dryRun) {
    res.send(JSON.stringify({ success: true, ...actions }));
  } else {
    res.send(JSON.stringify({ success: true }));
  }
});

app.post("/state/bet/", (req, res) => {
  res.set("Content-Type", "application/json");

  const { bets, tableName } = {
    bets: req.body.bets as RouletteBetSize,
    tableName: req.body.tableName,
  };

  const state = tableState[tableName];

  if (state && state.gameState) {
    state.processBet(bets);
    res.send(JSON.stringify({ success: true }));
  } else {
    res.send(JSON.stringify({ success: false }));
  }
});

app.get("/table/", (req, res) => {
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify(tableNames, null, 2));
});

app.post("/table/assign/", (req, res) => {
  res.set("Content-Type", "application/json");

  if (tableNames.length === 0) {
    res.send(JSON.stringify({ success: false }));
    return;
  }

  const response = {
    success: true,
    tableName: tableNames.shift(),
    lobbyUrl: config.lobbyUrl,
    dryRun: config.dryRun,
  };

  res.send(JSON.stringify(response, null, 2));
});

app.delete("/table/release/", (req, res) => {
  res.set("Content-Type", "application/json");

  const { tableName } = {
    tableName: req.body.tableName,
  };

  const isTableNameInConfig = config.tableNames.includes(tableName);
  const isTableNameAssigned = !tableNames.includes(tableName);

  if (!isTableNameInConfig || !isTableNameAssigned) {
    res.send(JSON.stringify({ success: false }));
  } else {
    tableNames.push(tableName);
    tableState[tableName] = undefined;
    res.send(JSON.stringify({ success: true }));
  }
});
