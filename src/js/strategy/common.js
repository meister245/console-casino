export class StrategyCommon {
    runStrategy() {
        throw new Error('abstract method')
    }

    runStageBet() {
        throw new Error('abstract method');
    }

    runStageResult() {
        throw new Error('abstract method');
    }

    runStageWait() {
        throw new Error('abstract method');
    }

    runStageSpin() {
        throw new Error('abstract method');
    }
}