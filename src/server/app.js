const express = require('express')
const cors = require('cors')
const app = express()

const { gameConfig, getStrategy } = require('./config')

const gameStats = {
  gamesWin: 0,
  gamesLose: 0,
  gamesAborted: 0,
  gamesInProgress: []
}

const strategyStats = {}

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/stats/', (req, res) => {
  res.send(JSON.stringify({
    game: gameStats,
    strategy: strategyStats
  }, null, 2))
})

app.get('/config/', (req, res) => {
  const strategy = getStrategy(req.query.game)

  res.send(JSON.stringify({
    strategy,
    config: gameConfig
  }))
})

app.post('/result/', (req, res) => {
  const result = req.body.result
  const strategy = req.body.strategy
  const multiplier = req.body.multiplier

  if (gameStats.gamesInProgress > 0) {
    gameStats.gamesInProgress.shift()
  }

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

  if (!(strategy in strategyStats)) {
    strategyStats[strategy] = 0
  }

  if (strategyStats[strategy] < multiplier) {
    strategyStats[strategy] = multiplier
  }

  res.send(JSON.stringify({ success: true }))
})

app.post('/bet/', (req, res) => {
  let success = false

  if (gameStats.gamesLose === 0 && gameStats.gamesAborted === 0) {
    const currentTime = Math.floor(Date.now() / 1000)

    if (gameStats.gamesInProgress.length < gameConfig.concurrentGamesLimit) {
      gameStats.gamesInProgress.push(currentTime)
      success = true
    } else if (gameStats.gamesInProgress.length > 0) {
      const oldestTime = gameStats.gamesInProgress[0]
      const timeDiff = currentTime - oldestTime

      if (timeDiff > 60 * 10) {
        gameStats.gamesInProgress.shift()
        gameStats.gamesInProgress.push(currentTime)
        success = true
      }
    }
  }

  res.send(JSON.stringify({ success: success }))
})

app.listen(8080, () => console.log('console-casino server is running'))
