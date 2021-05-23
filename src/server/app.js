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
  gamesInProgress: 0
}

app.get('/', cors(), (req, res) => {
  res.send(JSON.stringify(serverState))
})

app.get('/config/', cors(), (req, res) => {
  res.send(JSON.stringify(gameConfig))
})

app.get('/result/win/', cors(), (req, res) => {
  if (serverState.gamesInProgress > 0) {
    serverState.gamesInProgress -= 1
    serverState.gamesWin += 1
  }

  res.send(JSON.stringify({ success: true }))
})

app.get('/result/lose/', cors(), (req, res) => {
  if (serverState.gamesInProgress > 0) {
    serverState.gamesInProgress -= 1
    serverState.gamesLose += 1
  }

  res.send(JSON.stringify({ success: true }))
})

app.get('/bet/', cors(), (req, res) => {
  const success = serverState.gamesInProgress < gameConfig.concurrentGamesLimit

  if (success) {
    serverState.gamesInProgress += 1
  }

  res.send(JSON.stringify({ success: success }))
})

app.listen(8080, () => console.log('console-casino server is running'))
