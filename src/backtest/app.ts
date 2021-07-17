import RouletteBetManager from "../client/betManager/roulette";
import Utils from "../util";

const utils = new Utils();
const config = utils.getConfig();
const strategies = utils.getStrategies();

const betManager = new RouletteBetManager(undefined, config, strategies);

// disable client logging
betManager.logMessage = () => undefined;

const backtestProcess = async (numbers: number[], tableName: string) => {
  for (let i = 0; i < numbers.length; i++) {
    const number = numbers[i];
    const numberHistory = numbers.slice(0, i + 1);

    if (!betManager.state.gameState) {
      const serverState = await betManager.getServerState(tableName);

      if (!serverState.running) {
        throw new Error("server stopped");
      }

      await betManager.findMatchingStrategy(
        numberHistory,
        serverState,
        tableName
      );
    }

    if (betManager.state.gameState) {
      betManager.state.setNextBetSize(config.chipSize);
      await betManager.submitBets(tableName);
      await betManager.resultEvaluate(number, tableName);
    }
  }
};

const backtest = async () => {
  const filePaths = utils.getBacktestFiles();

  for (const filePath of filePaths) {
    console.log(`processing file: ${filePath}`);

    const numbers = utils.readBacktestFile(filePath);
    const tableName = filePath.split("/").pop();

    await backtestProcess(numbers, tableName);

    await betManager.deleteServerState();
    betManager.state.resetGameState();
  }
};

backtest();
