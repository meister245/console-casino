import express = require("express");
import cors = require("cors");

import { logger, logRequest } from "./logger";
import State from "./state";
import Stats from "./stats";
import {
  getClient,
  getConfig,
  restoreGameState,
  restoreGameStats,
  writeGameState,
  writeGameStats,
} from "./util";

export const app = express();
export const state = new State();
export const stats = new Stats();

restoreGameState(state);
restoreGameStats(stats);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (require.main === module) {
  app.use(logRequest);
}

const config = getConfig();
const clientSource = getClient();

app.get("/client/", (req, res) => {
  res.set("Content-Type", "application/javascript");
  res.send(clientSource);
});

app.get("/config/", (req, res) => {
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify(config));
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
  const { action, tableName } = {
    action: req.body?.action ?? undefined,
    tableName: req.body?.tableName ?? undefined,
  };

  const response = { success: true, tableName: tableName };

  if (action === "assign") {
    response.tableName = state.assignTable();
  } else if (action === "delete") {
    state.removeTable(tableName);
  } else {
    response.success = false;
  }

  res.set("Content-Type", "application/json");
  res.send(JSON.stringify(response));
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

  if (action === "init" && !currentGameState.active) {
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

    writeGameStats(stats.getServerStats());
  } else {
    success = false;
  }

  const updatedGameState = state.getGameState();

  writeGameState(updatedGameState);
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ success, state: updatedGameState }));
});

if (require.main === module) {
  app.listen(8080, () => logger.info("console-casino server is running"));
}
