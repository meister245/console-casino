import RouletteBetManager from "../client/betManager/roulette";
import { GameStage } from "../client/state";
import Utils from "../util";

const utils = new Utils();
const config = utils.getConfig();
const strategies = utils.getStrategies();

const betManager = new RouletteBetManager(undefined, config, strategies);

betManager.state.setGameStage(GameStage.BET);

const backtestProcess = async (numbers: number[]) => {
  const tableName = "backtestTable";

  for (let i = 0; i < numbers.length; i++) {
    const number = numbers[i];

    if (!betManager.state.gameState) {
      const numberHistory = numbers.slice(0, i + 1);

      await betManager.findMatchingStrategy(
        numberHistory,
        undefined,
        tableName
      );
    }

    if (betManager.state.gameState) {
      betManager.state.setNextBetSize(0.1);
      await betManager.submitBets(tableName);
      await betManager.resultEvaluate(number, tableName);
    }
  }
};

const backtest = async () => {
  const filePaths = utils.getBacktestFiles();

  for (const filePath of filePaths) {
    const numbers = utils.readBacktestFile(filePath);
    await backtestProcess(numbers);
  }
};

backtest();
