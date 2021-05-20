import { CommonBot } from './common'
import { RouletteStrategy } from '../strategy/roulette'

export class RouletteBot extends CommonBot {
  constructor (driver) {
    super()
    this.driver = driver
  }

  start (bagSize = 5.0, options = {}) {
    options = this.getOptions(options)

    if (!options.dryRun && bagSize > this.driver.getBalance()) {
      throw new Error('balance too low')
    }

    const strategy = new RouletteStrategy(this.driver, bagSize, options)

    while (true) {
      strategy.runStrategy()
      this.sleep(1500)
    }
  }

  async backtest (strategyName, bagSize, options = {}) {
    let numbers; let strategy

    options = await this.getOptions(options)
    options.dryRun = true

    try {
      numbers = await this.driver.getExtendedHistory()
    } catch (e) {
      await this.driver.viewExtendedHistory()
      numbers = await this.driver.getExtendedHistory()
    } finally {
      strategy = await this.getStrategy('backtest', strategyName, bagSize, options)
      await strategy.runBacktest(numbers)
    }
  }
}
