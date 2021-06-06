const express = require('express')
const cors = require('cors')
const app = express()

const { getStats, updateStats } = require('./stats')
const { rouletteConfig } = require('./config')
const { gameState, initGameBet, resetGameState } = require('./state')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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
  const { gameStats } = getStats()

  if (gameStats.gamesLose === 0 && gameStats.gamesAborted === 0) {
    if (!gameState.active) {
      initGameBet(req.body.strategyName)
      res.send(JSON.stringify({ success: true }))
    } else {
      res.send(JSON.stringify({ success: false }))
    }
  }

  res.send(JSON.stringify({ success: false }))
})

app.post('/result/', (req, res) => {
  resetGameState()
  updateStats(req.body.result, req.body.strategy, req.body.multiplier)
  res.send(JSON.stringify({ success: true }))
})

app.post('/suspend/', (req, res) => {
  res.send(JSON.stringify({ success: true }))
})

app.listen(8080, () => console.log('console-casino server is running'))
