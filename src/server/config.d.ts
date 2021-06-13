export type RouletteBotConfig = {
    config: RouletteConfig
    strategies: RouletteStrategies
}

interface RouletteConfig {
    chipSize: number
    dryRun: boolean
    driverName: string
    minBalance: number
}

interface RouletteStrategies {
    [entry: string]: RouletteStrategy
}

interface RouletteStrategy {
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