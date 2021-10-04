import { consoleLogger as logger } from "./common/logger";
import { app, config, utils } from "./roulette/app";

if (!utils.getEnv()) {
  throw new Error("no environment specified");
}

app.listen(8080, () => {
  logger.info(`environment: ${config.dryRun ? "DEVELOPMENT" : "PRODUCTION"}`);
  logger.info("console-casino server is running");
});
