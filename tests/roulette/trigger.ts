import assert from "assert";

import {
  RouletteBet,
  RouletteTriggerAction,
} from "../../src/server/roulette/enums";
import {
  getWinTypes,
  isPatternMatching,
  isPercentageMatching,
} from "../../src/server/roulette/trigger";

describe("Roulette triggers", () => {
  it("win types are correctly retrieved", (done) => {
    assert.deepStrictEqual(getWinTypes(8), [
      "black",
      "low",
      "even",
      "dozenFirst",
      "columnMiddle",
      "lineTwo",
      "lineThree",
    ]);

    assert.deepStrictEqual(getWinTypes(25), [
      "red",
      "high",
      "odd",
      "dozenThird",
      "columnBottom",
      "lineEight",
      "lineNine",
    ]);

    assert.deepStrictEqual(getWinTypes(0), ["straightZero"]);
    assert.deepStrictEqual(getWinTypes(66), []);

    done();
  });

  it("pattern is matched for last number", (done) => {
    assert.deepStrictEqual(
      isPatternMatching([5, 11, 6], [[RouletteBet.HIGH]]),
      false
    );

    assert.deepStrictEqual(
      isPatternMatching([5, 11, 6], [[RouletteBet.LOW]]),
      true
    );

    done();
  });

  it("pattern is matched for all numbers", (done) => {
    assert.deepStrictEqual(
      isPatternMatching(
        [33, 15, 1],
        [
          [
            RouletteBet.DOZEN_FIRST,
            RouletteBet.DOZEN_SECOND,
            RouletteBet.DOZEN_THIRD,
          ],
        ]
      ),
      true
    );

    assert.deepStrictEqual(
      isPatternMatching(
        [33, 15, 1],
        [
          [
            RouletteBet.DOZEN_FIRST,
            RouletteBet.DOZEN_FIRST,
            RouletteBet.DOZEN_THIRD,
          ],
        ]
      ),
      false
    );

    done();
  });

  it("at least one patterns must match", (done) => {
    assert.deepStrictEqual(
      isPatternMatching(
        [33, 15, 1],
        [
          [RouletteBet.HIGH, RouletteBet.HIGH],
          [RouletteBet.LOW, RouletteBet.LOW],
        ]
      ),
      true
    );

    assert.deepStrictEqual(
      isPatternMatching(
        [33, 15, 1, 22],
        [
          [RouletteBet.DOZEN_FIRST, RouletteBet.LOW],
          [RouletteBet.DOZEN_SECOND, RouletteBet.HIGH],
        ]
      ),
      false
    );

    done();
  });

  it("distribution matched using equal", (done) => {
    const numberHistory = [1, 4, 5, 21, 6, 7, 8, 14, 22, 6];

    assert.deepStrictEqual(
      isPercentageMatching(numberHistory, [
        {
          betType: RouletteBet.HIGH,
          sampleSize: 10,
          percentage: 20,
          action: RouletteTriggerAction.EQUAL,
        },
      ]),
      true
    );

    assert.deepStrictEqual(
      isPercentageMatching(numberHistory, [
        {
          betType: RouletteBet.HIGH,
          sampleSize: 10,
          percentage: 30,
          action: RouletteTriggerAction.EQUAL,
        },
      ]),
      false
    );

    done();
  });

  it("distribution matched using lower or equal", (done) => {
    const numberHistory = [1, 4, 5, 21, 6, 7, 8, 14, 22, 6];

    assert.deepStrictEqual(
      isPercentageMatching(numberHistory, [
        {
          betType: RouletteBet.HIGH,
          sampleSize: 10,
          percentage: 30,
          action: RouletteTriggerAction.LOWER_EQUAL,
        },
      ]),
      true
    );

    assert.deepStrictEqual(
      isPercentageMatching(numberHistory, [
        {
          betType: RouletteBet.HIGH,
          sampleSize: 10,
          percentage: 15,
          action: RouletteTriggerAction.LOWER_EQUAL,
        },
      ]),
      false
    );

    done();
  });

  it("distribution matched using higher or equal", (done) => {
    const numberHistory = [1, 4, 5, 21, 6, 7, 8, 14, 22, 6];

    assert.deepStrictEqual(
      isPercentageMatching(numberHistory, [
        {
          betType: RouletteBet.HIGH,
          sampleSize: 10,
          percentage: 15,
          action: RouletteTriggerAction.HIGHER_EQUAL,
        },
      ]),
      true
    );

    assert.deepStrictEqual(
      isPercentageMatching(numberHistory, [
        {
          betType: RouletteBet.HIGH,
          sampleSize: 10,
          percentage: 30,
          action: RouletteTriggerAction.HIGHER_EQUAL,
        },
      ]),
      false
    );

    done();
  });

  it("all distributions must match", (done) => {
    const numberHistory = [1, 4, 5, 21, 6, 7, 8, 14, 22, 6];

    assert.deepStrictEqual(
      isPercentageMatching(numberHistory, [
        {
          betType: RouletteBet.HIGH,
          sampleSize: 10,
          percentage: 20,
          action: RouletteTriggerAction.EQUAL,
        },
        {
          betType: RouletteBet.LOW,
          sampleSize: 10,
          percentage: 80,
          action: RouletteTriggerAction.EQUAL,
        },
      ]),
      true
    );

    assert.deepStrictEqual(
      isPercentageMatching(numberHistory, [
        {
          betType: RouletteBet.HIGH,
          sampleSize: 10,
          percentage: 20,
          action: RouletteTriggerAction.EQUAL,
        },
        {
          betType: RouletteBet.LOW,
          sampleSize: 10,
          percentage: 60,
          action: RouletteTriggerAction.LOWER_EQUAL,
        },
      ]),
      false
    );

    done();
  });
});
