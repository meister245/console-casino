import { CommonBot } from './common'
import { RouletteBetManager } from '../betManager/roulette'

export class RouletteBot extends CommonBot {
  async start () {
    const { config, strategy } = await this.getConfig('roulette')

    while (!this.driver.getDealerMessage()) {
      await this.driver.sleep(1500)
    }

    const balance = await this.driver.getBalance()

    if (!config.dryRun && config.minBalance > balance) {
      throw new Error('balance too low')
    }

    if (this.running) {
      throw new Error('already started')
    }

    this.running = true

    const betManager = new RouletteBetManager(this.driver, config, strategy)

    betManager.logMessage(config.dryRun ? 'DEVELOPMENT' : 'PRODUCTION')

    while (this.running) {
      await betManager.runStrategy()
      await this.driver.sleep(1500)
    }
  }

  async stop () {
    this.running = false
  }
}
