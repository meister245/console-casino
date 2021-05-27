import { rouletteNumbers, gameState } from '../constants'
import { BetManager } from './common'

const lostGameUrl =
  'https://www.scienceabc.com/wp-content/uploads/ext-www.scienceabc.com/wp-content/uploads/2019/06/bankruptcy-meme.jpg-.jpg'

export class RouletteBetManager extends BetManager {
  constructor (driver, config, strategy) {
    super()

    this.driver = driver
    this.config = config
    this.strategy = strategy
    this.lastLogMessage = null

    this.state = {
      gameCount: 0,
      pendingGame: null,
      gameStage: gameState.stageSpin
    }
  }

  async runStrategy () {
    const modalMessage = this.driver.getModalMessage()
    const timeSinceLastBet = Math.floor(Date.now() / 1000) - this.lastBetTime

    if (!this.state.pendingGame && timeSinceLastBet > 25 * 60) {
      window.location.reload()
      return
    } else if (modalMessage && modalMessage.match(/(inactive|disconnected|restart|unavailable)/g)) {
      this.state.pendingGame && await this.reportResult('abort', this.state.pendingGame)
      window.location.reload()
      return
    } else if (modalMessage && modalMessage.match(/table.will.be.closed/g)) {
      this.state.pendingGame && await this.reportResult('abort', this.state.pendingGame)
      return
    }

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

  runStageSpin (dealerMessage) {
    this.logMessage('waiting for next spin')

    if (dealerMessage === 'wait for the next round') {
      this.state.gameStage = gameState.stageBet
    }
  }

  async runStageBet (dealerMessage) {
    this.logMessage('waiting to be able to place bets')

    if (['place your bets', 'last bets'].includes(dealerMessage)) {
      if (this.state.pendingGame === null) {
        const numberHistory = this.driver.getNumberHistory()

        for (const strategyName in this.strategy) {
          const strategy = this.strategy[strategyName]

          let patternMatching = false
          let percentageMatching = false

          if (this.isPatternMatching(strategy.trigger.pattern, numberHistory)) {
            patternMatching = true
          }

          if (this.isPercentageMatching(strategy.trigger.distribution, numberHistory)) {
            percentageMatching = true
          }

          if (patternMatching && percentageMatching) {
            await this.registerBet(strategyName, strategy)
            break
          }
        }
      } else {
        this.logMessage(`continue betting - ${this.state.pendingGame.strategy}`)
        await this.submitBets()
      }

      this.state.gameStage = gameState.stageWait
    }
  }

  async registerBet (strategyName, strategy) {
    this.logMessage(`strategy matched - ${strategyName}`)
    const response = await this.requestBet()

    if (response.success) {
      this.logMessage('server accepted bet')
      this.setupGameState(strategyName, strategy)
      await this.submitBets()
    } else {
      this.logMessage('server refused bet')
    }
  }

  runStageWait (dealerMessage) {
    this.logMessage('waiting for next round')

    if (dealerMessage === 'wait for the next round') {
      if (this.state.pendingGame) {
        this.state.gameStage = gameState.stageResults
      } else {
        this.state.gameStage = gameState.stageBet
      }
    }
  }

  async runStageResult (dealerMessage, lastNumber) {
    this.logMessage('waiting for result')

    if (['place your bets', 'last bets'].includes(dealerMessage)) {
      this.logMessage('processing results')

      if (this.state.pendingGame) {
        const winTypes = this.getWinTypes(lastNumber)
        const strategy = this.strategy[this.state.pendingGame.strategy]

        let isWin = false

        strategy.bets.forEach(betName => {
          isWin = isWin || winTypes.includes(betName)
        })

        if (isWin) {
          const response = await this.reportResult('win', this.state.pendingGame)
          response.success && this.logMessage('registered win, resetting state')

          this.state.gameCount += 1
          this.state.pendingGame = null
        } else if (this.state.pendingGame.multiplier.current !== this.state.pendingGame.multiplier.limit) {
          this.state.pendingGame.multiplier.current += 1
          this.state.pendingGame.betSize = this.state.pendingGame.betSize * this.state.pendingGame.multiplier.progression
          this.logMessage('lost game, increasing progression multiplier')
        } else {
          const response = await this.reportResult('lose', this.state.pendingGame)
          response.success && this.logMessage('registered loss')
          window.location.href = lostGameUrl
        }
      }

      this.state.gameStage = gameState.stageBet
    }
  }

  async submitBets () {
    let totalBetSize = 0

    await this.driver.sleep(2500)

    !this.config.dryRun && await this.driver.setChipSize(this.config.chipSize)

    for (const betName of this.state.pendingGame.bets) {
      const betSize = this.state.pendingGame.betSize.valueOf()
      const clickTimes = Math.floor(betSize / this.config.chipSize)

      for (let step = 0; step < clickTimes; step++) {
        !this.config.dryRun && await this.driver.setBet(betName)
        totalBetSize += this.config.chipSize.valueOf()
        this.logMessage(`click ${step + 1}`)
      }
    }

    !this.config.dryRun && this.updateLastBetTime()

    this.logMessage(`bets: ${this.state.pendingGame.bets}`)
    this.logMessage(`total: ${totalBetSize}`)
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

  setupGameState (strategyName, strategy) {
    this.state.pendingGame = {
      bets: strategy.bets,
      betSize: this.config.chipSize.valueOf(),
      strategy: strategyName,
      multiplier: {
        current: 1,
        limit: strategy.stopLossLimit,
        progression: strategy.progressionMultiplier
      }
    }
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
