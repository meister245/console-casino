import winston from "winston";

import { NextFunction } from "connect";
import { Request, Response } from "express";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "cyan",
  http: "magenta",
  debug: "white",
};

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({ filename: "/var/tmp/console-casino.log" }),
];

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

winston.addColors(colors);

export const logger = winston.createLogger({
  level: "info",
  levels,
  format,
  transports,
});

export const logRequest = (
  req: Request,
  res: Response,
  done: NextFunction
): void => {
  logger.info(`${req.method} ${req.url}`);

  if (Object.keys(req.body).length > 0) {
    logger.info(JSON.stringify(req.body));
  }

  done();
};
