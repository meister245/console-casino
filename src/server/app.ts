import express = require("express");
import cors = require("cors");

import Utils from "../util";
import { BetRequestAction, GameResult, RouletteBetConfig } from "./../types";
import { logger, logRequest } from "./logger";
import State from "./state";
import Stats from "./stats";

export const utils = new Utils();
export const config = utils.getConfig();
export const strategies = utils.getStrategies();
export const clientSource = utils.getClient();

export const app = express();
export const stats = new Stats();
export const state = new State();

if (!utils.getEnv()) {
  throw new Error("no environment specified");
}

utils.restoreGameState(state);
utils.restoreGameStats(stats);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (require.main === module) {
  app.use(logRequest);

  // workaround for WSL2 network bridge stuck connections
  app.use((req, res, next) => {
    res.set("Connection", "close");
    next();
  });
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

app.delete("/state/reset/", (req, res) => {
  state.resetGameState();
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ success: true }));
});

app.get("/stats/", (req, res) => {
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify(stats.getServerStats(), null, 2));
});

app.post("/table/", (req, res) => {
  const tableRegex = state.assignTable(config);
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ success: true, tableRegex }));
});

app.post("/table/backtest/", (req, res) => {
  const { numbers, tableName } = {
    numbers: req.body.numbers,
    tableName: req.body.tableName,
  };

  if (tableName in utils.backtestCollectionState) {
    const lastCollectionTime = utils.backtestCollectionState[tableName];

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

  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ success: true }));
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
    state.updateGameState(betSize, betProgression);
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
    betStrategy: req.body.betStrategy,
    betSize: req.body.betSize,
    tableName: req.body.tableName,
  };

  const strategy = strategies[betStrategy];
  const bets = strategy.bets.map((elem: RouletteBetConfig) => elem.betType);

  utils.writeGameBet(bets, betSize, betStrategy, tableName);
  res.send(JSON.stringify({ success: true }));
});

if (require.main === module) {
  app.listen(8080, () => {
    logger.info(`environment: ${config.dryRun ? "DEVELOPMENT" : "PRODUCTION"}`);
    logger.info("console-casino server is running");
  });
}
