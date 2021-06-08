const gameState = {
  active: false,
  suspended: false,
  betSize: undefined,
  betStrategy: undefined,
  tableName: undefined
}

const resetGameState = () => {
  gameState.active = false
  gameState.suspended = false
  gameState.betSize = undefined
  gameState.betStrategy = undefined
  gameState.tableName = undefined
}

const initGameState = (strategyName, tableName) => {
  gameState.active = true
  gameState.suspended = false
  gameState.betStrategy = strategyName
  gameState.tableName = tableName
}

const updateGameState = (betSize) => {
  gameState.betSize = betSize
}

const suspendGameState = (betSize) => {
  gameState.active = false
  gameState.suspended = true
  gameState.betSize = betSize
  gameState.betStrategy = undefined
  gameState.tableName = undefined
}

const resumeSuspendedGameState = (strategyName, tableName) => {
  gameState.active = true
  gameState.suspended = true
  gameState.betStrategy = strategyName
  gameState.tableName = tableName
}

module.exports = {
  gameState,
  initGameState,
  updateGameState,
  resetGameState,
  resumeSuspendedGameState,
  suspendGameState
}
