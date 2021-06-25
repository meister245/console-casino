import express = require("express");
import cors = require("cors");

import { logger, logRequest } from "./logger";
import State from "./state";
import Stats from "./stats";
import { GameResult } from "./types";
import Utils from "./util";

export const app = express();

export const state = new State();
export const stats = new Stats();
export const utils = new Utils();

utils.restoreGameState(state);
utils.restoreGameStats(stats);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (require.main === module) {
  app.use(logRequest);
}

const config = utils.getConfig();
const strategies = utils.getStrategies();
const clientSource = utils.getClient();

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
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ success: true, tableName: state.assignTable() }));
});

app.delete("/table/", (req, res) => {
  state.removeTable(req.body?.tableName ?? "");
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ success: true }));
});

app.post("/bet/", (req, res) => {
  let success = true;

  const { action, betStrategy, betSize, betResult, betMultiplier, tableName } =
    {
      action: req.body?.action ?? undefined,
      betStrategy: req.body?.betStrategy ?? undefined,
      betSize: req.body?.betSize ?? undefined,
      betResult: req.body?.betResult ?? undefined,
      betMultiplier: req.body?.betMultiplier ?? undefined,
      tableName: req.body?.tableName ?? undefined,
    };

  const currentGameState = state.getGameState();
  const isTableMatching = tableName === currentGameState.tableName;

  if (!currentGameState.running) {
    success = false;
  } else if (action === "init" && !currentGameState.active) {
    currentGameState.suspended
      ? state.resumeSuspendedGameState(betStrategy, tableName)
      : state.initGameState(betStrategy, tableName);
  } else if (
    action === "update" &&
    currentGameState.active &&
    isTableMatching
  ) {
    state.updateGameState(betSize);
  } else if (
    action === "suspend" &&
    currentGameState.active &&
    isTableMatching
  ) {
    state.suspendGameState(betSize, betStrategy);
  } else if (action === "reset" && currentGameState.active && isTableMatching) {
    state.resetGameState();
    stats.updateStats(betResult, betStrategy, betMultiplier, tableName);

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

if (require.main === module) {
  app.listen(8080, () => logger.info("console-casino server is running"));
}
