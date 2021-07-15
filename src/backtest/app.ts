import RouletteBetManager from "../client/betManager/roulette";
import Utils from "../util";

const utils = new Utils();
const config = utils.getConfig();
const strategies = utils.getStrategies();

const betManager = new RouletteBetManager(undefined, config, strategies);

// disable client logging
betManager.logMessage = () => undefined;

const tableName = "backtest";

const backtestProcess = async (numbers: number[]) => {
  for (let i = 0; i < numbers.length; i++) {
    const number = numbers[i];

    if (!betManager.state.gameState) {
      const numberHistory = numbers.slice(0, i + 1);
      const serverState = await betManager.getServerState(tableName);

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

    await backtestProcess(numbers);
  }
};

backtest();
