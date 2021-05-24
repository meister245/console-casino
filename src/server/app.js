const express = require('express')
const cors = require('cors')
const app = express()

const gameConfig = {
  dryRun: true,
  chipSize: 0.1,
  minBalance: 26.0,
  concurrentGamesLimit: 1
}

const serverState = {
  gamesWin: 0,
  gamesLose: 0,
  gamesInProgress: []
}

app.get('/', cors(), (req, res) => {
  res.send(JSON.stringify(serverState))
})

app.get('/config/', cors(), (req, res) => {
  res.send(JSON.stringify(gameConfig))
})

app.get('/result/win/', cors(), (req, res) => {
  if (serverState.gamesInProgress > 0) {
    serverState.gamesInProgress.shift()
    serverState.gamesWin += 1
  }

  res.send(JSON.stringify({ success: true }))
})

app.get('/result/lose/', cors(), (req, res) => {
  if (serverState.gamesInProgress > 0) {
    serverState.gamesInProgress.shift()
    serverState.gamesLose += 1
  }

  res.send(JSON.stringify({ success: true }))
})

app.get('/bet/', cors(), (req, res) => {
  let success = false

  const currentTime = Math.floor(Date.now() / 1000)

  if (serverState.gamesInProgress.length < gameConfig.concurrentGamesLimit) {
    serverState.gamesInProgress.push(currentTime)
    success = true
  } else if (serverState.gamesInProgress.length > 0) {
    const oldestTime = serverState.gamesInProgress[0]
    const timeDiff = currentTime - oldestTime

    if (timeDiff > 60 * 10) {
      serverState.gamesInProgress.shift()
      serverState.gamesInProgress.push(currentTime)
      success = true
    }
  }

  res.send(JSON.stringify({ success: success }))
})

app.listen(8080, () => console.log('console-casino server is running'))
