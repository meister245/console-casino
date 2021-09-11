import assert from "assert";

import { RouletteGameResult } from "../../src/server/roulette/enums";
import RouletteStats from "../../src/server/roulette/stats";
import { RouletteGameState } from "../../src/server/roulette/types";

describe("Roulette stats", () => {
  const tableName = "unittest";
  const strategyName = "unittest";

  it("default roulette stats", (done) => {
    const stats = new RouletteStats();

    assert.deepStrictEqual(Object.keys(stats), [
      "dateStarted",
      "totalProfit",
      "totalGames",
      "tableStats",
      "strategyStats",
      "strategyGroupStats",
    ]);

    assert.deepStrictEqual(stats.totalGames, 0);
    assert.deepStrictEqual(stats.totalProfit, 0);

    assert.deepStrictEqual(stats.tableStats, {});
    assert.deepStrictEqual(stats.strategyStats, {});
    assert.deepStrictEqual(stats.strategyGroupStats, {});

    done();
  });

  it("setup roulette table stats", (done) => {
    const stats = new RouletteStats();

    stats.setupTableStats(tableName);
    const tableStats = stats.tableStats[tableName];

    assert.deepStrictEqual(Object.keys(stats.tableStats), [tableName]);
    assert.deepStrictEqual(tableStats, {
      gamesWin: 0,
      gamesLose: 0,
      gamesAbort: 0,
      gamesNull: 0,
    });

    done();
  });

  it("roulette table stats can be updated", (done) => {
    const stats = new RouletteStats();

    stats.setupTableStats(tableName);
    const tableStats = stats.tableStats[tableName];

    stats.updateTableStats(RouletteGameResult.WIN, tableName);
    assert.deepStrictEqual(tableStats.gamesWin, 1);

    stats.updateTableStats(RouletteGameResult.LOSE, tableName);
    assert.deepStrictEqual(tableStats.gamesLose, 1);

    stats.updateTableStats(RouletteGameResult.ABORT, tableName);
    assert.deepStrictEqual(tableStats.gamesAbort, 1);

    stats.updateTableStats(RouletteGameResult.NULL, tableName);
    assert.deepStrictEqual(tableStats.gamesNull, 1);

    done();
  });

  it("setup roulette strategy stats", (done) => {
    const stats = new RouletteStats();

    stats.setupStrategyStats(stats.strategyStats, strategyName);
    const strategyStats = stats.strategyStats[strategyName];

    assert.deepStrictEqual(Object.keys(stats.strategyStats), [strategyName]);
    assert.deepStrictEqual(strategyStats, {
      count: 0,
      percent: 0,
      profit: 0,
      progression: {},
      results: {
        gamesWin: 0,
        gamesLose: 0,
        gamesAbort: 0,
        gamesNull: 0,
      },
    });

    done();
  });

  it("roulette strategy stats can be updated", (done) => {
    const stats = new RouletteStats();

    stats.setupStrategyStats(stats.strategyStats, strategyName);
    const strategyStatsItem = stats.strategyStats[strategyName];

    stats.updateStrategyStats(
      stats.strategyStats,
      strategyName,
      0,
      3,
      RouletteGameResult.NULL
    );

    stats.updateStrategyStats(
      stats.strategyStats,
      strategyName,
      5.5,
      4,
      RouletteGameResult.WIN
    );

    stats.updateStrategyStats(
      stats.strategyStats,
      strategyName,
      -0.5,
      5,
      RouletteGameResult.LOSE
    );

    assert.deepStrictEqual(strategyStatsItem, {
      count: 3,
      percent: Infinity,
      profit: 5.0,
      progression: {
        "3": {
          count: 1,
          percent: Infinity,
          profit: 0,
        },
        "4": {
          count: 1,
          percent: Infinity,
          profit: 5.5,
        },
        "5": {
          count: 1,
          percent: Infinity,
          profit: -0.5,
        },
      },
      results: {
        gamesWin: 1,
        gamesLose: 1,
        gamesAbort: 0,
        gamesNull: 1,
      },
    });

    done();
  });

  it("roulette stats can be updated", (done) => {
    const stats = new RouletteStats();

    const gameStateOne = {
      profit: 3.0,
      strategyName: "strategyOne",
      betProgression: 3,
    } as RouletteGameState;

    stats.updateStats(RouletteGameResult.WIN, tableName, gameStateOne);

    const gameStateTwo = {
      profit: -2.0,
      strategyName: "strategyTwo",
      betProgression: 4,
    } as RouletteGameState;

    stats.updateStats(RouletteGameResult.LOSE, tableName, gameStateTwo);

    assert.deepStrictEqual(stats.strategyGroupStats, {
      unspecified: {
        count: 2,
        percent: 100,
        profit: 1.0,
        progression: {
          "3": {
            count: 1,
            percent: 50,
            profit: 3.0,
          },
          "4": {
            count: 1,
            percent: 50,
            profit: -2.0,
          },
        },
        results: {
          gamesWin: 1,
          gamesLose: 1,
          gamesAbort: 0,
          gamesNull: 0,
        },
      },
    });

    assert.deepStrictEqual(stats.strategyStats, {
      strategyOne: {
        count: 1,
        percent: 50,
        profit: 3.0,
        progression: {
          "3": {
            count: 1,
            percent: 50,
            profit: 3.0,
          },
        },
        results: {
          gamesWin: 1,
          gamesLose: 0,
          gamesAbort: 0,
          gamesNull: 0,
        },
      },
      strategyTwo: {
        count: 1,
        percent: 50,
        profit: -2.0,
        progression: {
          "4": {
            count: 1,
            percent: 50,
            profit: -2.0,
          },
        },
        results: {
          gamesWin: 0,
          gamesLose: 1,
          gamesAbort: 0,
          gamesNull: 0,
        },
      },
    });

    done();
  });
});
