const { logger } = require('./logger')

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

  logger.info('reset game state')
  logger.info(gameState)
}

const initGameState = (strategyName, tableName) => {
  gameState.active = true
  gameState.suspended = false
  gameState.betStrategy = strategyName
  gameState.tableName = tableName

  logger.info('initialized game state')
  logger.info(gameState)
}

const updateGameState = (betSize) => {
  gameState.betSize = betSize

  logger.info('updated game state')
  logger.info(gameState)
}

const suspendGameState = (betSize) => {
  gameState.active = false
  gameState.suspended = true
  gameState.betSize = betSize
  gameState.betStrategy = undefined
  gameState.tableName = undefined

  logger.info('suspended game state')
  logger.info(gameState)
}

const resumeSuspendedGameState = (strategyName, tableName) => {
  gameState.active = true
  gameState.suspended = true
  gameState.betStrategy = strategyName
  gameState.tableName = tableName

  logger.info('resumed suspended game state')
  logger.info(gameState)
}

module.exports = {
  gameState,
  initGameState,
  updateGameState,
  resetGameState,
  resumeSuspendedGameState,
  suspendGameState
}
