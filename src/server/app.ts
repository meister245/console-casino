import express = require("express");
import cors = require("cors");

import { getClient, getConfig } from "./config";
import { logger, logRequest } from "./logger";
import State from "./state";
import { getStats, updateStats } from "./stats";

export const app = express();
export const state = new State();

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
  res.send(JSON.stringify(getStats(), null, 2));
});

app.post("/table/", (req, res) => {
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ success: true, tableName: state.assignTable() }));
});

app.delete("/table/", (req, res) => {
  const tableName = req.body?.tableName ?? "";
  state.removeTable(tableName);
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ success: true, tableName: tableName }));
});

app.post("/bet/", (req, res) => {
  let success = true;

  const gameState = state.getGameState();

  const { action, betStrategy, betSize, betResult, betMultiplier, tableName } =
    {
      action: req.body?.action ?? undefined,
      betStrategy: req.body?.betStrategy ?? undefined,
      betSize: req.body?.betSize ?? undefined,
      betResult: req.body?.betResult ?? undefined,
      betMultiplier: req.body?.betMultiplier ?? undefined,
      tableName: req.body?.tableName ?? undefined,
    };

  const isTableMatching = tableName === gameState.tableName;

  if (action === "init" && !gameState.active) {
    gameState.suspended
      ? state.resumeSuspendedGameState(betStrategy, tableName)
      : state.initGameState(betStrategy, tableName);
  } else if (action === "update" && gameState.active && isTableMatching) {
    state.updateGameState(betSize);
  } else if (action === "suspend" && gameState.active && isTableMatching) {
    state.suspendGameState(betSize, betStrategy);
  } else if (action === "reset" && gameState.active && isTableMatching) {
    state.resetGameState();
    updateStats(betResult, betStrategy, betMultiplier, tableName);
  } else {
    success = false;
  }

  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ success, state: gameState }));
});

if (require.main === module) {
  app.listen(8080, () => logger.info("console-casino server is running"));
}
