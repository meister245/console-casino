const gameState = {
  active: false,
  suspended: false,
  lastBetSize: 0,
  lastBetStrategy: undefined,
  lastGameTime: undefined
}

const resetGameState = () => {
  gameState.active = false
  gameState.suspended = false
  gameState.lastBetSize = 0
  gameState.lastBetStrategy = undefined
  gameState.lastGameTime = undefined
}

const initGameBet = (strategyName) => {
  gameState.active = true
  gameState.suspended = false
  gameState.lastBetStrategy = strategyName
  gameState.lastGameTime = Math.floor(Date.now() / 1000)
}

module.exports = {
  gameState,
  initGameBet,
  resetGameState
}
