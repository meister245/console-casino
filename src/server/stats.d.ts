export enum GameResult {
    WIN = 'win',
    LOSE = 'lose',
    ABORT = 'abort'
}

export type GameStats = {
    resultStats: ResultStats
    multiplierStats: MultiplierStats
    strategyMultiplierStats: StrategyMultiplierStats
}

export interface ResultStats {
    gamesWin: number
    gamesLose: number
    gamesAborted: number
}

export interface MultiplierStats {
    [entry: string]: ResultCountPercent
}

export interface StrategyMultiplierStats {
    [strategy: string]: ResultCountPercent & { multiplier: MultiplierStats }
}

interface ResultCountPercent {
    count: number
    percent: number
}