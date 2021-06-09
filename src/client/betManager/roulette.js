import { rouletteNumbers, gameState } from '../constants'
import { BetManager } from './common'

const lostGameUrl =
  'https://www.scienceabc.com/wp-content/uploads/ext-www.scienceabc.com/wp-content/uploads/2019/06/bankruptcy-meme.jpg-.jpg'

const messages = {
  waitForNextRound: 'wait for the next round',
  placeYourBets: 'place your bets',
  lastBets: 'last bets'
}

export class RouletteBetManager extends BetManager {
  constructor (driver, config, strategies) {
    super(driver)

    this.config = config
    this.strategies = strategies
    this.lastLogMessage = null

    this.state = {
      gameCount: 0,
      pendingGame: null,
      gameStage: gameState.stageSpin
    }
  }

  async start () {
    const modalMessage = this.driver.getModalMessage().toLowerCase()

    if (modalMessage && modalMessage.match(/(inactive|disconnected|restart|unavailable)/g)) {
      this.state.pendingGame && await this.reportResult('abort', this.state.pendingGame)
      window.location.reload()
      return
    } else if (modalMessage && modalMessage.match(/table.will.be.closed/g)) {
      this.state.pendingGame && await this.reportResult('abort', this.state.pendingGame)
      return
    }

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
        await this.runStageResult(dealerMessage)
        break
    }
  }

  runStageSpin (dealerMessage) {
    this.logMessage('waiting for next spin')

    if (dealerMessage === messages.waitForNextRound) {
      this.state.gameStage = gameState.stageBet
    }
  }

  async runStageBet (dealerMessage) {
    this.logMessage('waiting to be able to place bets')

    if ([messages.placeYourBets, messages.lastBets].includes(dealerMessage)) {
      if (this.state.pendingGame === null) {
        const numberHistory = this.driver.getNumberHistory()

        const {
          suspended: lastGameSuspended,
          betStrategy: lastBetStrategy
        } = await this.getServerState()

        for (const strategyName in this.strategies) {
          const strategy = this.strategies[strategyName]

          let patternMatching = false
          let percentageMatching = false
          let suspendedMatching = false

          if (strategy.trigger.parent && strategy.trigger.parent.includes(lastBetStrategy)) {
            suspendedMatching = true
          }

          if (this.isPatternMatching(strategy.trigger.pattern, numberHistory)) {
            patternMatching = true
          }

          if (this.isPercentageMatching(strategy.trigger.distribution, numberHistory)) {
            percentageMatching = true
          }

          const isStrategyMatching = patternMatching && percentageMatching &&
            lastGameSuspended === suspendedMatching

          if (isStrategyMatching) {
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

    const tableName = this.driver.getTableName()
    const { success, serverState } = await this.betInit(strategyName, tableName)

    if (success) {
      this.logMessage('server accepted bet')
      this.setupGameState(strategy, serverState)
      this.logMessage(serverState)
      await this.submitBets()
    } else {
      this.logMessage('server refused bet')
    }
  }

  runStageWait (dealerMessage) {
    this.logMessage('waiting for next round')

    const expectedMessage = this.config.dryRun || this.state.pendingGame === null
      ? messages.waitForNextRound
      : ''

    if (dealerMessage === expectedMessage) {
      if (this.state.pendingGame) {
        this.state.gameStage = gameState.stageResults
      } else {
        this.state.gameStage = gameState.stageBet
      }
    }
  }

  async runStageResult (dealerMessage) {
    this.logMessage('waiting for result')

    if ([messages.placeYourBets, messages.lastBets].includes(dealerMessage)) {
      this.logMessage('processing results')

      const lastNumber = this.driver.getLastNumber()

      if (this.state.pendingGame) {
        const tableName = this.driver.getTableName()
        const winTypes = this.getWinTypes(lastNumber)
        const strategy = this.strategies[this.state.pendingGame.strategy]

        const isSuspendLossReached =
          this.state.pendingGame.suspendLossLimit !== 0 &&
          this.state.pendingGame.progressionCount === this.state.pendingGame.suspendLossLimit

        const isStopLossReached =
          this.state.pendingGame.stopLossLimit !== 0 &&
          this.state.pendingGame.progressionCount === this.state.pendingGame.stopLosslimit

        let isWin = false

        strategy.bets.forEach(betName => {
          isWin = isWin || winTypes.includes(betName)
        })

        if (isWin) {
          const { success } = await this.betReset('win', this.state.pendingGame, tableName)
          success && this.logMessage('registered win, reset server state')

          this.state.gameCount += 1
          this.state.pendingGame = null
        } else if (this.state.pendingGame.suspendLoss > 0) {
          this.state.pendingGame.betSize = this.state.pendingGame.betSize * this.state.pendingGame.progressionMultiplier

          if (!isSuspendLossReached) {
            const { success } = await this.betUpdate(this.state.betSize, tableName)
            success && this.logMessage('updated bet size, updated server state')
            this.state.pendingGame.progressionCount += 1
          } else if (isSuspendLossReached) {
            const { success } = await this.betSuspend(this.state.betSize, tableName)
            success && this.logMessage('suspend limit reached, reset server state')
            this.state.pendingGame = null
          }
        } else if (this.state.pendingGame.stopLosslimit > 0) {
          this.state.pendingGame.betSize = this.state.pendingGame.betSize * this.state.pendingGame.progressionMultiplier

          if (!isStopLossReached) {
            const { success } = await this.betUpdate(this.state.betSize, tableName)
            success && this.logMessage('updated bet size, updated server state')
            this.state.pendingGame.progressionCount += 1
          } else if (isStopLossReached) {
            const { success } = await this.betReset('lose', this.state.pendingGame, tableName)
            success && this.logMessage('registered loss, reset server state')
            this.state.pendingGame = null
            window.location.href = lostGameUrl
          }
        }
      }

      this.state.gameStage = gameState.stageBet
    }
  }

  async submitBets () {
    let totalBetSize = 0

    await this.driver.sleep(2000)

    !this.config.dryRun && await this.driver.setChipSize(this.config.chipSize)

    for (const betName of this.state.pendingGame.bets) {
      const clickTimes = Math.floor(
        this.state.pendingGame.betSize / this.config.chipSize)

      for (let step = 0; step < clickTimes; step++) {
        !this.config.dryRun && await this.driver.setBet(betName)
        totalBetSize += this.config.chipSize.valueOf()
        this.logMessage(`click ${betName} ${step + 1}`)
      }
    }

    this.logMessage(`bets: ${this.state.pendingGame.bets}`)
    this.logMessage(`total: ${totalBetSize.toFixed(2)}`)
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

  setupGameState (strategy, serverState) {
    this.state.pendingGame = {
      bets: strategy.bets,
      betSize: serverState.betSize
        ? serverState.betSize
        : this.config.chipSize.valueOf(),
      strategy: serverState.betStrategy,
      suspended: serverState.suspended,
      progressionCount: 1,
      progressionMultiplier: strategy.progressionMultiplier,
      stopWinLimit: strategy.limits?.stopWin ?? 0,
      stopLosslimit: strategy.limits?.stopLoss ?? 0,
      suspendLossLimit: strategy.limits?.suspendLoss ?? 0
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
