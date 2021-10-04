import winston from "winston";

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

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({
    format: () => new Date().toISOString().slice(0, 23),
  }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const getLogger = (
  level?: string,
  transports?: winston.transport[]
): winston.Logger => {
  const loggerLevel = level || "debug";
  const loggerTransports = transports || [new winston.transports.Console()];

  return winston.createLogger({
    level: loggerLevel,
    levels,
    format,
    transports: loggerTransports,
  });
};

const consoleLogger = getLogger();
const fileLogger = getLogger("info", transports);

export { consoleLogger, fileLogger };
