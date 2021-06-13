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

export interface ServerState {
    active: boolean
    suspended: boolean
    betSize?: number
    betStrategy?: string
    tableName?: string
}

export type RouletteBotConfig = {
    config: RouletteConfig
    strategies: RouletteStrategies
}

export interface RouletteConfig {
    chipSize: number
    dryRun: boolean
    driverName: string
    minBalance: number
}

export interface RouletteStrategies {
    [entry: string]: RouletteStrategy
}

export interface RouletteStrategy {
    bets: string[]
    limits: RouletteLimits
    progressionMultiplier: number
    trigger: RouletteTriggers
}

interface RouletteLimits {
    stopWin?: number
    stopLoss?: number
    suspendLoss?: number
}

interface RouletteTriggers {
    parent?: string[]
    pattern?: string[]
    distribution?: (string | number)[]
}