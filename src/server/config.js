const rouletteStrategy = require('./strategy/roulette')

const gameConfig = {
  dryRun: true,
  chipSize: 0.1,
  minBalance: 26.0,
  concurrentGamesLimit: 1
}

const getStrategy = (name) => {
  switch (name) {
    case 'roulette':
      return rouletteStrategy
    default:
      throw new Error('invalid strategy name')
  }
}

module.exports = {
  gameConfig,
  getStrategy
}
