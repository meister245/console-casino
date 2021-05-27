const express = require('express')
const cors = require('cors')
const app = express()

const { getStats, updateStats } = require('./stats')
const { getConfig, getStrategy } = require('./config')

const gamesInProgress = []

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/stats/', (req, res) => {
  const stats = getStats()
  res.send(JSON.stringify({ gamesInProgress, ...stats }, null, 2))
})

app.get('/config/', (req, res) => {
  res.send(JSON.stringify({
    config: getConfig(),
    strategy: getStrategy(req.query.game)
  }))
})

app.post('/result/', (req, res) => {
  gamesInProgress > 0 && gamesInProgress.shift()
  updateStats(req.body.result, req.body.strategy, req.body.multiplier)
  res.send(JSON.stringify({ success: true }))
})

app.post('/bet/', (req, res) => {
  const { gameStats } = getStats()
  const { concurrentGamesLimit } = getConfig()

  let success = false

  if (gameStats.gamesLose === 0 && gameStats.gamesAborted === 0) {
    const currentTime = Math.floor(Date.now() / 1000)

    if (gamesInProgress.length < concurrentGamesLimit) {
      gamesInProgress.push(currentTime)
      success = true
    } else if (gamesInProgress.length > 0) {
      const oldestTime = gamesInProgress[0]
      const timeDiff = currentTime - oldestTime

      if (timeDiff > 60 * 10) {
        gamesInProgress.shift()
        gamesInProgress.push(currentTime)
        success = true
      }
    }
  }

  res.send(JSON.stringify({ success: success }))
})

app.listen(8080, () => console.log('console-casino server is running'))
