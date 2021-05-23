import { rouletteNumbers, gameState } from '../constants'
import { rouletteStrategy } from '../strategy/roulette'
import { BetManager } from './common'

export class RouletteBetManager extends BetManager {
  constructor (driver, config) {
    super()

    this.driver = driver
    this.config = config
    this.lastLogMessage = null

    this.state = {
      gameCount: 0,
      pendingGame: null,
      gameStage: gameState.stageSpin
    }
  }

  async runStrategy () {
    try {
      const msg = this.driver.getModalConfirm()
      msg.match(/(inactive|disconnected|restart)/g) && window.location.reload()
    } catch {} finally {
      const lastNumber = this.driver.getLastNumber()
      const dealerMessage = this.driver.getDealerMessage().toLowerCase()

      switch (this.state.gameStage) {
        case gameState.stageSpin:
          this.runStageSpin(dealerMessage)
          break
        case gameState.stageBet:
          await this.runStageBet(dealerMessage)
          break
        case gameState.stageWait:
          this.runStageWait(dealerMessage)
          break
        case gameState.stageResults:
          await this.runStageResult(dealerMessage, lastNumber)
          break
      }
    }
  }

  runStageSpin (dealerMessage) {
    this.logMessage('waiting for next round')

    if (dealerMessage === 'wait for the next round') {
      this.state.gameStage = gameState.stageBet
    }
  }

  async runStageBet (dealerMessage) {
    this.logMessage('waiting to be able to place bets')

    if (['place your bets', 'last bets'].includes(dealerMessage)) {
      if (this.state.pendingGame === null) {
        this.logMessage('no bets in progress')

        const numberHistory = this.driver.getNumberHistory()

        for (const strategyName in rouletteStrategy) {
          const strategy = rouletteStrategy[strategyName]

          let patternMatching = false
          let percentageMatching = false

          if (this.isPatternMatching(strategy.trigger.pattern, numberHistory)) {
            patternMatching = true
          }

          if (this.isPercentageMatching(strategy.trigger.distribution, numberHistory)) {
            percentageMatching = true
          }

          if (patternMatching && percentageMatching) {
            this.logMessage('strategy matched - ' + strategyName)

            const response = await fetch('http://localhost:8080/bet/')
              .then(resp => resp.json())

            if (response.success) {
              this.logMessage('server accepted bet')

              this.state.pendingGame = {
                bets: strategy.bets,
                progression: strategy.progression,
                strategy: strategyName,
                multiplier: {
                  current: 1,
                  limit: strategy.stopLossLimit
                }
              }

              this.submitBets()
            } else {
              this.logMessage('server refused bet')
            }

            break
          }
        }
      } else {
        this.logMessage('continue with betting')
        this.submitBets()
      }

      this.state.gameStage = gameState.stageWait
    }
  }

  runStageWait (dealerMessage) {
    this.logMessage('waiting for next round')

    if (dealerMessage === 'wait for the next round') {
      this.state.gameStage = gameState.stageResults
    }
  }

  async runStageResult (dealerMessage, lastNumber) {
    this.logMessage('waiting for result')

    if (['place your bets', 'last bets'].includes(dealerMessage)) {
      this.logMessage('processing results')

      if (this.state.pendingGame) {
        const winTypes = this.getWinTypes(lastNumber)
        const strategy = rouletteStrategy[this.state.pendingGame.strategy]

        let isWin = false

        strategy.bets.forEach(betName => {
          if (winTypes.includes(betName)) {
            isWin = true
          }
        })

        if (isWin) {
          const response = await fetch('http://localhost:8080/result/win/').then(resp => resp.json())
          response.success && this.logMessage('registered win, resetting state')

          this.state.gameCount += 1
          this.state.pendingGame = null
        } else if (this.state.pendingGame.multiplier.current !== this.state.pendingGame.multiplier.limit) {
          this.state.pendingGame.multiplier.current += 1
          this.logMessage('lost game, increasing progression multiplier')
        } else {
          const response = await fetch('http://localhost:8080/result/lose/').then(resp => resp.json())
          response.success && this.logMessage('registered loss')

          window.location.href = 'https://www.scienceabc.com/wp-content/uploads/ext-www.scienceabc.com/wp-content/uploads/2019/06/bankruptcy-meme.jpg-.jpg'
        }
      }

      this.state.gameStage = gameState.stageBet
    }
  }

  submitBets () {
    let betSize = 0

    !this.config.dryRun && this.driver.setChipSize(this.config.chipSize)

    this.state.pendingGame.bets.forEach(bet => {
      !this.config.dryRun && this.driver.setBet(bet)
      betSize += this.config.chipSize
    })

    for (let step = 1; step < this.state.pendingGame.multiplier.current; step++) {
      !this.config.dryRun && this.driver.setBetDouble()
      betSize = betSize * 2
    }

    this.logMessage('bets: ' + this.state.pendingGame.bets)
    this.logMessage('total: ' + betSize)
  }

  isPercentageMatching (config, numberHistory) {
    const sampleBet = config[0]
    const sampleSize = config[1]
    const percentageTarget = config[2]
    const percentageOperator = config[3]

    const betNumbers = rouletteNumbers[sampleBet]
    const sampleNumberSet = numberHistory.slice(0, sampleSize)

    let occurrence = 0

    sampleNumberSet.forEach(n => {
      if (betNumbers.includes(n)) {
        occurrence = occurrence + 1
      }
    })

    const percentage = Math.floor(occurrence / sampleNumberSet.length * 100)

    switch (percentageOperator) {
      case 'lowerEqual':
        return percentage <= percentageTarget
      case 'equal':
        return percentage === percentageTarget
      case 'higherEqual':
        return percentage >= percentageTarget
      default:
        return false
    }
  }

  isPatternMatching (pattern, lastNumbers) {
    for (const i in pattern) {
      const betPattern = pattern[i]
      const resultNumber = lastNumbers[i]
      const resultWinTypes = this.getWinTypes(resultNumber)

      if (!resultWinTypes.includes(betPattern)) {
        return false
      }
    }

    return true
  }

  getWinTypes (lastNumber) {
    const winTypes = []

    for (const betType in rouletteNumbers) {
      if (rouletteNumbers[betType].includes(lastNumber)) {
        winTypes.push(betType)
      }
    }

    return winTypes
  }

  logMessage (msg) {
    const logMessage = [
      'console-casino', this.state.gameStage, this.state.gameCount, msg]

    if (logMessage.toString() !== this.lastLogMessage) {
      this.lastLogMessage = logMessage.toString()
      console.log(logMessage.join(' - '))
    }
  }
}
