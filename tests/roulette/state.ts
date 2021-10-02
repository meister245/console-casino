import assert from "assert";

import { RouletteGameResult } from "../../src/server/roulette/enums";
import RouletteTableState from "../../src/server/roulette/state";
import {
  betStrategyHighTriggerLineSevenPercent,
  betStrategyRedLowTriggerLineSevenPercent,
  testChipSize,
  testStrategyName,
  testTableName,
} from "../constants";

describe("Roulette table state", () => {
  const numbers = [2, 12, 21, 23, 12, 5, 7];

  it("default roulette table state", (done) => {
    const state = new RouletteTableState(testTableName, numbers, testChipSize);

    assert.deepStrictEqual(state.lastNumber, 7);
    assert.deepStrictEqual(state.lastNumbers, numbers);
    assert.deepStrictEqual(state.gameState, undefined);

    done();
  });

  it("table stored numbers can be updated", (done) => {
    const state = new RouletteTableState(testTableName, numbers, testChipSize);

    state.updateNumbers(8);

    assert.deepStrictEqual(state.lastNumber, 8);
    assert.deepStrictEqual(state.lastNumbers, [2, 12, 21, 23, 12, 5, 7, 8]);

    done();
  });

  it("table stored numbers can be updated with custom limit", (done) => {
    const state = new RouletteTableState(testTableName, numbers, testChipSize);

    state.updateNumbers(6, 5);

    assert.deepStrictEqual(state.lastNumber, 6);
    assert.deepStrictEqual(state.lastNumbers, [23, 12, 5, 7, 6]);

    done();
  });

  it("default roulette table game state", (done) => {
    const state = new RouletteTableState(testTableName, numbers, testChipSize);

    state.setupGameState(
      betStrategyRedLowTriggerLineSevenPercent,
      testStrategyName
    );

    assert.deepStrictEqual(state.gameState, {
      bet: { red: 0, low: 0.5 },
      betClick: { red: 0, low: 1 },
      betChipSize: { red: 0.1, low: 0.5 },
      betProgression: 1,
      betStrategy: betStrategyRedLowTriggerLineSevenPercent,
      strategyName: testStrategyName,
      profit: 0,
    });

    done();
  });

  it("roulette table game state progression", (done) => {
    const state = new RouletteTableState(testTableName, numbers, testChipSize);

    state.setupGameState(
      betStrategyRedLowTriggerLineSevenPercent,
      testStrategyName
    );

    state.setNextBetProgression();

    assert.deepStrictEqual(state.gameState.betProgression, 2);
    assert.deepStrictEqual(state.gameState.bet, { red: 0.1, low: 1.5 });
    assert.deepStrictEqual(state.gameState.betClick, { red: 1, low: 3 });
    assert.deepStrictEqual(state.gameState.betChipSize, { red: 0.1, low: 0.5 });

    state.setNextBetProgression();

    assert.deepStrictEqual(state.gameState.betProgression, 3);
    assert.deepStrictEqual(state.gameState.bet, { red: 0.2, low: 1.0 });
    assert.deepStrictEqual(state.gameState.betClick, { red: 1, low: 1 });
    assert.deepStrictEqual(state.gameState.betChipSize, { red: 0.2, low: 1.0 });

    state.setNextBetProgression();

    assert.deepStrictEqual(state.gameState.betProgression, 4);
    assert.deepStrictEqual(state.gameState.bet, { red: 0.4, low: 2.0 });
    assert.deepStrictEqual(state.gameState.betClick, { red: 2, low: 1 });
    assert.deepStrictEqual(state.gameState.betChipSize, { red: 0.2, low: 2.0 });

    done();
  });

  it("roulette table game state win result", (done) => {
    const state = new RouletteTableState(testTableName, numbers, testChipSize);

    state.setupGameState(
      betStrategyHighTriggerLineSevenPercent,
      testStrategyName
    );

    state.setNextBetProgression();
    state.setNextBetProgression();
    state.updateNumbers(22);

    assert.deepStrictEqual(state.resultEvaluate(), RouletteGameResult.WIN);

    done();
  });

  it("roulette table game state progress result", (done) => {
    const state = new RouletteTableState(testTableName, numbers, testChipSize);

    state.setupGameState(
      betStrategyHighTriggerLineSevenPercent,
      testStrategyName
    );

    state.setNextBetProgression();
    state.setNextBetProgression();
    state.updateNumbers(11);

    assert.deepStrictEqual(state.resultEvaluate(), RouletteGameResult.PROGRESS);

    done();
  });

  it("roulette table game state lose result", (done) => {
    const state = new RouletteTableState(testTableName, numbers, testChipSize);

    state.setupGameState(
      betStrategyHighTriggerLineSevenPercent,
      testStrategyName
    );

    state.setNextBetProgression();
    state.setNextBetProgression();
    state.setNextBetProgression();
    state.setNextBetProgression();
    state.updateNumbers(5);

    assert.deepStrictEqual(state.resultEvaluate(), RouletteGameResult.LOSE);

    done();
  });
});
