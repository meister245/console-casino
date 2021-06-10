const { getConfig } = require('./util')

const gameStats = {
  gamesWin: 0,
  gamesLose: 0,
  gamesAborted: 0
}

const multiplierStats = {}
const { strategies } = getConfig()

const strategyStats = Object.keys(strategies).reduce(
  (obj, item) => Object.assign(obj, { [item]: {} }), {})

const updateGameStats = (result) => {
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

const updateStrategyStats = (strategy, multiplier) => {
  const totalGames = Object.values(gameStats).reduce((obj, item) => obj + item, 0)
  const strategyMultiplierStats = strategyStats[strategy]?.multiplier ?? {}

  if (!(multiplier in multiplierStats)) {
    multiplierStats[multiplier] = { count: 0, percent: 0 }
  }

  multiplierStats[multiplier].count += 1

  Object.keys(multiplierStats).forEach(key => {
    multiplierStats[key].percent =
      Math.floor(multiplierStats[key].count / totalGames * 100)
  })

  if (!(multiplier in strategyMultiplierStats)) {
    strategyMultiplierStats[multiplier] = 0
  }

  strategyMultiplierStats[multiplier] += 1
  strategyStats[strategy].multiplier = strategyMultiplierStats
}

module.exports = {
  gameStats,
  getStats: () => {
    return {
      gameStats,
      strategyStats,
      multiplierStats
    }
  },
  updateStats: (result, strategy, multiplier) => {
    updateGameStats(result)
    // updateStrategyStats(strategy, multiplier)
  }
}
