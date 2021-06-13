import express = require('express')
import cors = require('cors')

import { getConfig, getClient } from './config'
import { logger, logRequest } from './logger'
import { getStats, updateStats } from './stats'

import {
  gameState,
  initGameState,
  updateGameState,
  suspendGameState,
  resumeSuspendedGameState,
  resetGameState
} from './state'

export const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

if (require.main === module) {
  app.use(logRequest)
}

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
  res.send(JSON.stringify({ success, serverState: gameState }))
})

if (require.main === module) {
  app.listen(8080, () => logger.info('console-casino server is running'))
}
