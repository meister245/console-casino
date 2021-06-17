import fs = require("fs");
import path = require("path");

import { RouletteBotConfig } from "./types";

const getConfig = (name = "roulette"): RouletteBotConfig => {
  const filePath = path.resolve(
    __dirname,
    "..",
    "..",
    "resources",
    "config",
    `${name}.json`
  );

  const content = fs.readFileSync(filePath, { encoding: "utf8" });
  return JSON.parse(content);
};

const getClient = (): unknown => {
  const filePath = path.resolve(__dirname, "..", "..", "dist", "client.min.js");

  return fs.readFileSync(filePath, { encoding: "utf8" });
};

export { getClient, getConfig };
