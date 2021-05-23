import { CommonBot } from './common'
import { RouletteBetManager } from '../betManager/roulette'

export class RouletteBot extends CommonBot {
  async start (options = {}) {
    const opts = await this.getOptions(options)

    while (!this.driver.isGameLoaded()) {
      await this.sleep(1500)
    }

    const balance = await this.driver.getBalance()

    if (!options.dryRun && opts.bagSize > balance) {
      throw new Error('balance too low')
    }

    if (this.running) {
      throw new Error('already started')
    }

    this.running = true

    const betManager = new RouletteBetManager(this.driver, opts)

    this.driver.toggleExtendedHistory()

    while (this.running) {
      await betManager.runStrategy()
      await this.sleep(1500)
    }
  }

  async stop () {
    this.running = false
  }
}
