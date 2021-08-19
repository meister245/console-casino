import RouletteBetManager from "../client/betManager/roulette";
import Utils from "../util";

const utils = new Utils();
const config = utils.getConfig();
const strategies = utils.getStrategies();

const betManager = new RouletteBetManager(undefined, config, strategies);

// disable client logging
betManager.logMessage = () => undefined;

const numberOfTables = 6;
const averageSecondsPerGame = 38;

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
        99999,
        numberHistory,
        serverState,
        tableName
      );
    }

    if (betManager.state.gameState) {
      betManager.state.setNextBetSize();
      await betManager.submitBets(tableName);
      await betManager.resultEvaluate(number, tableName);
    }
  }
};

const logResults = async (totalNumbers: number) => {
  const totalSeconds = totalNumbers * averageSecondsPerGame;

  const totalDays = totalSeconds / 60 / 60 / 24;
  const totalDaysParallel = totalDays / numberOfTables;

  const { totalProfit, totalGames } = await betManager.getServerStats();

  const averageProfitPerDay = totalProfit / totalDays;
  const averageProfitPerDayParallel = totalProfit / totalDaysParallel;

  const averageGamesPerDay = totalGames / totalDays;
  const averageGamesPerDayParallel = totalGames / totalDaysParallel;

  console.log();

  console.log(`=== total ===`);
  console.log(`total games - ${totalGames}`);
  console.log(`total profit - ${totalProfit}`);
  console.log(`total number of days - 1 table - ${totalDays.toFixed(1)}`);
  console.log(
    `total number of days - 6 table - ${totalDaysParallel.toFixed(1)}`
  );

  console.log();

  console.log(`=== average games ===`);
  console.log(`per day - 1 table - ${averageGamesPerDay.toFixed(2)}`);
  console.log(
    `per day - ${numberOfTables} table - ${averageGamesPerDayParallel.toFixed(
      2
    )}`
  );

  console.log();

  console.log(`=== average profit ===`);
  console.log(`per day - 1 table - ${averageProfitPerDay.toFixed(2)}`);
  console.log(`per week - 1 table - ${(averageProfitPerDay * 7).toFixed(2)}`);
  console.log(`per month - 1 table - ${(averageProfitPerDay * 30).toFixed(2)}`);

  console.log();

  console.log(
    `per day - ${numberOfTables} tables - ${averageProfitPerDayParallel.toFixed(
      2
    )}`
  );
  console.log(
    `per week - ${numberOfTables} tables - ${(
      averageProfitPerDayParallel * 7
    ).toFixed(2)}`
  );
  console.log(
    `per month - ${numberOfTables} tables - ${(
      averageProfitPerDayParallel * 30
    ).toFixed(2)}`
  );
};

const backtest = async () => {
  const filePaths = utils.getBacktestFiles();

  let totalNumbers = 0;

  for (const filePath of filePaths) {
    console.log(`processing file: ${filePath}`);

    const numbers = utils.readBacktestFile(filePath);
    const tableName = filePath.split("/").pop();

    totalNumbers += numbers.length;

    await backtestProcess(numbers, tableName);

    await betManager.deleteServerState();
    betManager.state.resetGameState();
  }

  await logResults(totalNumbers);
};

backtest();
