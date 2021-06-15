import express = require("express");
import cors = require("cors");

import { getClient, getConfig } from "./config";
import { logger, logRequest } from "./logger";
import {
  assignTable,
  initServerState,
  removeTable,
  resetServerState,
  resumeSuspendedServerState,
  serverState,
  suspendServerState,
  updateServerState,
} from "./state";
import { getStats, updateStats } from "./stats";

export const app = express();

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
  res.send(JSON.stringify(serverState, null, 2));
});

app.get("/stats/", (req, res) => {
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify(getStats(), null, 2));
});

app.post("/table/", (req, res) => {
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ success: true, tableName: assignTable() }));
});

app.delete("/table/", (req, res) => {
  const tableName = req.body?.tableName ?? "";
  removeTable(tableName);
  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ success: true, tableName: tableName }));
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

  const isTableMatching = tableName === serverState.tableName;

  if (action === "init" && !serverState.active) {
    serverState.suspended
      ? resumeSuspendedServerState(betStrategy, tableName)
      : initServerState(betStrategy, tableName);
  } else if (action === "update" && serverState.active && isTableMatching) {
    updateServerState(betSize);
  } else if (action === "suspend" && serverState.active && isTableMatching) {
    suspendServerState(betSize, betStrategy);
  } else if (action === "reset" && serverState.active && isTableMatching) {
    resetServerState();
    updateStats(betResult, betStrategy, betMultiplier, tableName);
  } else {
    success = false;
  }

  res.set("Content-Type", "application/json");
  res.send(JSON.stringify({ success, serverState }));
});

if (require.main === module) {
  app.listen(8080, () => logger.info("console-casino server is running"));
}
