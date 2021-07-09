import express = require("express");
import cors = require("cors");

import { BetRequestAction, GameResult } from "./../types";
import { logger, logRequest } from "./logger";
import State from "./state";
import Stats from "./stats";
import Utils from "./util";

export const utils = new Utils();
export const config = utils.getConfig();
export const strategies = utils.getStrategies();
export const clientSource = utils.getClient();

export const app = express();
export const stats = new Stats();
export const state = new State();

utils.restoreGameState(state);
utils.restoreGameStats(stats);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (require.main === module) {
  app.use(logRequest);
}

app.get("/client/", (req, res) => {
  res.set("Content-Type", "application/javascript");
  res.send(clientSource);
});

app.get("/config/", (req, res) => {
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ config, strategies }));
});

app.get("/state/", (req, res) => {
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify(state.getServerState(), null, 2));
});

app.get("/stats/", (req, res) => {
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify(stats.getServerStats(), null, 2));
});

app.post("/table/", (req, res) => {
  const tableName = state.assignTable(config);
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ success: true, tableName }));
});

app.delete("/table/", (req, res) => {
  state.removeTable(req.body?.tableName ?? "");
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ success: true }));
});

app.post("/bet/", (req, res) => {
  let success = true;

  const {
    action,
    betStrategy,
    betSize,
    betResult,
    betProgression,
    profit,
    tableName,
  } = {
    action: req.body?.action ?? undefined,
    betStrategy: req.body?.betStrategy ?? undefined,
    betSize: req.body?.betSize ?? undefined,
    betResult: req.body?.betResult ?? undefined,
    betProgression: req.body?.betProgression ?? undefined,
    profit: req.body?.profit ?? undefined,
    tableName: req.body?.tableName ?? undefined,
  };

  const currentGameState = state.getGameState();
  const isTableMatching = tableName === currentGameState.tableName;

  if (!currentGameState.running) {
    success = false;
  } else if (action === BetRequestAction.INIT && !currentGameState.active) {
    currentGameState.suspended
      ? state.resumeSuspendedGameState(betStrategy, tableName)
      : state.initGameState(betStrategy, tableName);
  } else if (
    action === BetRequestAction.UPDATE &&
    currentGameState.active &&
    isTableMatching
  ) {
    state.updateGameState(betSize);
  } else if (
    action === BetRequestAction.SUSPEND &&
    currentGameState.active &&
    isTableMatching
  ) {
    state.suspendGameState(betSize, betStrategy);
  } else if (
    action === BetRequestAction.RESET &&
    currentGameState.active &&
    isTableMatching
  ) {
    state.resetGameState();
    stats.updateStats(
      betResult,
      betStrategy,
      profit,
      betProgression,
      tableName
    );

    betResult === GameResult.LOSE && config.stopOnLoss && state.stopRunning();

    utils.writeGameStats(stats.getServerStats());
  } else {
    success = false;
  }

  const updatedGameState = state.getGameState();

  utils.writeGameState(updatedGameState);
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ success, state: updatedGameState }));
});

app.post("/bet/log/", (req, res) => {
  const { betStrategy, betSize, tableName } = {
    betSize: req.body.betSize,
    betStrategy: req.body.betStrategy,
    tableName: req.body.tableName,
  };

  const strategy = strategies[betStrategy];
  const totalSize = betSize * strategy.bets.length;

  utils.writeGameBet(strategy.bets, totalSize, betStrategy, tableName);
  res.send(JSON.stringify({ success: true }));
});

if (require.main === module) {
  app.listen(8080, () => {
    logger.info(`environment: ${config.dryRun ? "DEVELOPMENT" : "PRODUCTION"}`);
    logger.info("console-casino server is running");
  });
}
