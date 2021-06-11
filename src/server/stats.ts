enum GameResult {
  WIN = 'win',
  LOSE = 'lose',
  ABORT = 'abort'
}

interface ResultCountPercent {
  count: number
  percent: number
}

interface GameStats {
  gamesWin: number
  gamesLose: number
  gamesAborted: number
}

interface MultiplierStats {
  [entry: string]: ResultCountPercent
}

interface StrategyMultiplierStats {
  [strategy: string]: ResultCountPercent & { multiplier: MultiplierStats}
}


export const gameStats: GameStats = {
  gamesWin: 0,
  gamesLose: 0,
  gamesAborted: 0
}

const multiplierStats: MultiplierStats = {}
const strategyMultiplierStats: StrategyMultiplierStats = {}

export const getStats = () => {
  return {
    gameStats,
    multiplierStats,
    strategyMultiplierStats
  }
}

export const updateStats = (result: GameResult, strategy: string, multiplier: number) => {
  updateGameStats(result)
  updateMultiplierStats(multiplier)
  updateStrategyMultiplierStats(strategy, multiplier)
}

const updateGameStats = (result: GameResult) => {
  switch (result) {
    case 'win':
      gameStats.gamesWin += 1
      break
    case 'lose':
      gameStats.gamesLose += 1
      break
    case 'abort':
      gameStats.gamesAborted += 1
      break
  }
}

const updateMultiplierStats = (multiplier: number) => {
  const totalGames = Object.values(gameStats).reduce((obj, item) => obj + item, 0)

  if (!(multiplier in multiplierStats)) {
    multiplierStats[multiplier] = { count: 0, percent: 0 }
  }

  multiplierStats[multiplier].count += 1

  Object.keys(multiplierStats).forEach(key => {
    multiplierStats[key].percent =
      Math.floor(multiplierStats[key].count / totalGames * 100)
  })
}

const updateStrategyMultiplierStats = (strategy: string, multiplier: number) => {
  const totalGames = Object.values(gameStats).reduce((obj, item) => obj + item, 0)

  if (!(strategy in strategyMultiplierStats)) {
    strategyMultiplierStats[strategy] = {
      count: 0, percent: 0, multiplier: {} }
  }

  strategyMultiplierStats[strategy].count += 1

  if (!(multiplier in strategyMultiplierStats[strategy].multiplier)) {
    strategyMultiplierStats[strategy].multiplier[multiplier] = {
      count: 0, percent: 0 }
  }

  strategyMultiplierStats[strategy].multiplier[multiplier].count += 1

  Object.keys(strategyMultiplierStats).forEach(strategyKey => {
    const item = strategyMultiplierStats[strategyKey]
    item.percent = Math.floor(item.count / totalGames * 100)

    Object.keys(item.multiplier).forEach(multiplierKey => {
      const multiplierItem = item.multiplier[multiplierKey]
      multiplierItem.percent = Math.floor(multiplierItem.count / totalGames * 100)
    })
  })
}
