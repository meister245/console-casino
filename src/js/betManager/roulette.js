import { rouletteNumbers, gameState } from '../constants'
import { rouletteStrategy } from '../strategy/roulette'
import { BetManager } from './common'

export class RouletteBetManager extends BetManager {
  constructor (driver, options) {
    super()

    this.driver = driver
    this.options = options

    this.state = {
      pendingGame: null,
      gameStage: gameState.stageSpin,
      bagSizeCurrent: this.options.bagSize.valueOf()
    }
  }

  runStrategy () {
    let isNetworkError = false

    try {
      const msg = this.driver.getPopupMessage()
      isNetworkError = msg.match(/(reload|try\sagain)/g)
    } catch {
      isNetworkError = true
    }

    if (isNetworkError) {
      window.location.reload()
    }

    const lastNumber = this.driver.getLastNumber()
    const dealerMessage = this.driver.getDealerMessage().toLowerCase()

    switch (this.state.gameStage) {
      case gameState.stageSpin:
        this.runStageSpin(dealerMessage)
        break
      case gameState.stageBet:
        this.runStageBet(dealerMessage)
        break
      case gameState.stageWait:
        this.runStageWait(dealerMessage)
        break
      case gameState.stageResults:
        this.runStageResult(dealerMessage, lastNumber)
        break
    }
  }

  runStageSpin (dealerMessage) {
    this.logMessage('waiting for next round')

    if (dealerMessage === 'wait for the next round') {
      this.state.gameStage = gameState.stageBet
    }
  }

  runStageBet (dealerMessage) {
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

  runStageResult (dealerMessage, lastNumber) {
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
          this.logMessage('win')
          this.state.pendingGame = null
        } else if (this.state.pendingGame.multiplier.current !== this.state.pendingGame.multiplier.limit) {
          this.logMessage('lose')
          this.state.pendingGame.multiplier.current += 1
        } else {
          throw new Error('stop loss limit reached')
        }
      }

      this.state.gameStage = gameState.stageBet
    }
  }

  submitBets () {
    this.logMessage('submit bets')

    let betSize = 0

    !this.options.dryRun && this.driver.setChipSize(this.options.chipSize)

    this.state.pendingGame.bets.forEach(bet => {
      !this.options.dryRun && this.driver.setBet(bet)
      betSize += this.options.chipSize
    })

    for (let step = 1; step < this.state.pendingGame.multiplier.current; step++) {
      !this.options.dryRun && this.driver.setBetDouble()
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
    const logMessage = ['console-casino', this.state.gameStage, msg]
    console.log(logMessage.join(' - '))
  }
}
