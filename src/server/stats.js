const gameStats = {
  gamesWin: 0,
  gamesLose: 0,
  gamesAborted: 0
}

const multiplierStats = {}
const strategyMultiplierStats = {}

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

const updateMultiplierStats = (multiplier) => {
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

const updateStrategyMultiplierStats = (strategy, multiplier) => {
  const totalGames = Object.values(gameStats).reduce((obj, item) => obj + item, 0)

  if (!(strategy in strategyMultiplierStats)) {
    strategyMultiplierStats[strategy] = {
      count: 0, percent: 0, multiplier: {} }
  }

  strategyMultiplierStats[strategy].count += 1

  if (!(multiplierStats in strategyMultiplierStats[strategy])) {
    strategyMultiplierStats[strategy].multiplier[multiplier] = {
      count: 0, percent: 0 }
  }

  strategyMultiplierStats[strategy].multiplier[multiplier].count += 1

  Object.keys(strategyMultiplierStats).forEach(strategy => {
    const item = strategyMultiplierStats[strategy]
    item.percent = Math.floor(item.count / totalGames * 100)

    Object.keys(item.multiplier).forEach(key => {
      const multiplierItem = item.multiplier[key]
      multiplierItem.percent = Math.floor(multiplierItem.count / totalGames * 100)
    })
  })
}

module.exports = {
  gameStats,
  getStats: () => {
    return {
      gameStats,
      multiplierStats,
      strategyMultiplierStats
    }
  },
  updateStats: (result, strategy, multiplier) => {
    updateGameStats(result)
    updateMultiplierStats(multiplier)
    updateStrategyMultiplierStats(strategy, multiplier)
  }
}
