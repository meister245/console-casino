const express = require('express')
const cors = require('cors')
const app = express()

const { getConfig, getClient } = require('./util')

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

const config = getConfig()
const clientSource = getClient()

app.get('/client/', (req, res) => {
  res.set('Content-Type', 'application/javascript')
  res.send(clientSource)
})

app.get('/config/', (req, res) => {
  res.set('Content-Type', 'application/json')
  res.send(JSON.stringify(config))
})

app.get('/state/', (req, res) => {
  res.set('Content-Type', 'application/json')
  res.send(JSON.stringify(gameState, null, 2))
})

app.get('/stats/', (req, res) => {
  res.set('Content-Type', 'application/json')
  res.send(JSON.stringify(getStats(), null, 2))
})

app.post('/bet/', (req, res) => {
  let success = true

  const {
    action, betStrategy, betSize, betResult, betMultiplier, tableName
  } = {
    action: req.body?.action ?? undefined,
    betStrategy: req.body?.betStrategy ?? undefined,
    betSize: req.body?.betSize ?? undefined,
    betResult: req.body?.betResult ?? undefined,
    betMultiplier: req.body?.betMultiplier ?? undefined,
    tableName: req.body?.tableName ?? undefined
  }

  const isTableMatching = tableName === gameState.tableName

  if (action === 'init' && !gameState.active) {
    gameState.suspended
      ? resumeSuspendedGameState(betStrategy, tableName)
      : initGameState(betStrategy, tableName)
  } else if (action === 'update' && gameState.active && isTableMatching) {
    updateGameState(betSize)
  } else if (action === 'suspend' && gameState.active && isTableMatching) {
    suspendGameState(betSize, betStrategy)
  } else if (action === 'reset' && gameState.active && isTableMatching) {
    resetGameState()
    updateStats(betResult, betStrategy, betMultiplier)
  } else {
    success = false
  }

  res.set('Content-Type', 'application/json')
  res.send(JSON.stringify({ success: success, serverState: gameState }))
})

module.exports = app
