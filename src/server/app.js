const express = require('express')
const cors = require('cors')
const app = express()

const { rouletteConfig } = require('./config')
const { logger, logRequest, logRequestError } = require('./logger')

const {
  getStats,
  updateStats
} = require('./stats')

const {
  gameState,
  initGameState,
  updateGameState,
  suspendGameState,
  resumeSuspendedGameState,
  resetGameState
} = require('./state')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(logRequest)
app.use(logRequestError)

app.get('/config/', (req, res) => {
  res.send(JSON.stringify(rouletteConfig, null, 2))
})

app.get('/state/', (req, res) => {
  res.send(JSON.stringify(gameState, null, 2))
})

app.get('/stats/', (req, res) => {
  res.send(JSON.stringify(getStats(), null, 2))
})

app.post('/bet/', (req, res) => {
  const action = req.body.action
  const isTableMatching = req.body.tableName === gameState.tableName

  let success = true

  if (action === 'init' && !gameState.active) {
    gameState.suspended
      ? resumeSuspendedGameState(req.body.strategyName, req.body.tableName)
      : initGameState(req.body.strategyName, req.body.tableName)
  } else if (action === 'update' && gameState.active && isTableMatching) {
    updateGameState(req.body.betSize)
  } else if (action === 'suspend' && gameState.active && isTableMatching) {
    suspendGameState(req.body.betSize)
  } else if (action === 'reset' && gameState.active && isTableMatching) {
    resetGameState()
    updateStats(req.body.result, req.body.strategy, req.body.multiplier)
  } else {
    success = false
  }

  res.send(JSON.stringify({ success: success, serverState: gameState }))
})

app.listen(8080, () => logger.info('console-casino server is running'))
