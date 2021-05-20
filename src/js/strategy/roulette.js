import { rouletteNumbers, gameState } from '../constants'
import { StrategyCommon } from './common'

export class RouletteStrategy extends StrategyCommon {
  constructor (driver, bagSize, options) {
    super()

    this.driver = driver
    this.options = options
    this.lastBetTime = null

    this.results = {
      gameWin: 0,
      gameLose: 0,
      profit: 0
    }

    this.state = {
      bet: {},
      betNumber: 1,
      betMultiplier: 1,
      bagSize: bagSize.valueOf(),
      bagSizeCurrent: bagSize.valueOf(),
      gameStage: gameState.stageSpin
    }
  }

  runStrategy () {
    const lastNumber = this.driver.getLastNumber()
    const dealerMessage = this.driver.getDealerMessage().toLowerCase()

    switch (this.state.gameStage) {
      case gameState.stageSpin:
        this.runStageSpin(dealerMessage)
        break
      case gameState.stageBet:
        this.runStageBet(dealerMessage, lastNumber)
        break
      case gameState.stageWait:
        this.runStageWait(dealerMessage)
        break
      case gameState.stageResults:
        this.runStageResult(dealerMessage, lastNumber)
        break
    }
  }

  runBacktest (numbers) {
    for (let i = 1; i < numbers.length; i++) {
      this.state.gameStage = gameState.stageBet
      this.runStageBet('place your bets', numbers[i - 1])
      this.state.gameStage = gameState.stageResults
      this.runStageResult('place your bets', numbers[i])
    }
  }

  runStageSpin (dealerMessage) {
    if (dealerMessage === 'wait for the next round') {
      console.log('stage spin')
      this.state.gameStage = gameState.stageBet
    }
  }

  runStageBet (dealerMessage, lastNumber) {
    let betName = null
    let betMapping = null
    const msg = [this.state.betNumber, 'stage', 'bet']
    const totalBet = this.state.betMultiplier * this.options.chipSize

    if (dealerMessage === 'place your bets' || dealerMessage === 'last bets') {
      if (rouletteNumbers.red.includes(lastNumber)) {
        betName = 'red'
        betMapping = this.driver.rouletteBetMapping.red
      } else if (rouletteNumbers.black.includes(lastNumber)) {
        betName = 'black'
        betMapping = this.driver.rouletteBetMapping.black
      }

      msg.push('lastNumber', lastNumber)

      if (betName === null) {
        this.state.bet = { null: 0 }
      } else if (this.state.bagSizeCurrent < totalBet) {
        throw new Error('out of money')
      } else if (Object.keys(this.state.bet).length === 0) {
        for (let i = 1; i <= this.state.betMultiplier; i++) {
          if (!this.options.dryRun) {
            this.driver.setChipSize(this.options.chipSize)
            this.driver.setBet(betMapping)
          }

          this.state.bagSizeCurrent -= this.options.chipSize
        }

        this.state.bet[betName] = totalBet
        msg.push('bet', betName, totalBet.toFixed(2))
      }

      console.log(msg.join(' '))

      this.state.gameStage = gameState.stageWait
    }
  }

  runStageWait (dealerMessage) {
    if (dealerMessage === 'wait for the next round') {
      console.log(this.state.betNumber + ' stage wait')
      this.state.gameStage = gameState.stageResults
    }
  }

  runStageResult (dealerMessage, lastNumber) {
    let resultName = null
    const msg = [this.state.betNumber, 'stage', 'result']

    if (dealerMessage === 'place your bets' || dealerMessage === 'last bets') {
      if (rouletteNumbers.black.includes(lastNumber)) {
        resultName = 'black'
      } else if (rouletteNumbers.red.includes(lastNumber)) {
        resultName = 'red'
      }

      if ('null' in this.state.bet) {
        msg.push('N/A')

        this.state.bet = {}
      } else if (resultName in this.state.bet) {
        msg.push('win')

        this.state.bagSizeCurrent += this.state.bet[resultName] * 2

        if (this.state.bagSizeCurrent > this.state.bagSize) {
          this.results.profit += this.state.bagSizeCurrent - this.state.bagSize
          this.state.bagSizeCurrent = this.state.bagSize.valueOf()
          this.state.betMultiplier = 1
        }

        this.results.gameWin += 1
        this.state.bet = {}
        this.state.betMultiplier -= (this.state.betMultiplier === 1) ? 0 : 1
      } else if (Object.keys(this.state.bet).length > 0) {
        msg.push('lose')

        this.results.gameLose += 1
        this.state.bet = {}
        this.state.betMultiplier += 1
      }

      msg.push('bagsize', this.state.bagSizeCurrent.toFixed(2))
      msg.push('profit', this.results.profit.toFixed(2))

      console.log(msg.join(' '))

      this.state.gameStage = gameState.stageBet
      this.state.betNumber += 1
    }
  }

  getWinTypes (lastNumber) {
    const winTypes = []

    Object.keys(rouletteNumbers).forEach(key => {
      if (rouletteNumbers[key].includes(lastNumber)) {
        winTypes.push(key)
      }
    })

    return winTypes
  }
}
