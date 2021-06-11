import { CommonBot } from './common'
import { RouletteBetManager } from '../betManager/roulette'

export class RouletteBot extends CommonBot {
  async start () {
    const { config, strategies } = await this.getConfig()

    const driver = await this.getDriver(config.driverName)

    while (!driver.getDealerMessage()) {
      await driver.sleep(1500)
    }

    if (!config.dryRun && config.minBalance > driver.getBalance()) {
      throw new Error('balance too low')
    }

    const betManager = new RouletteBetManager(driver, config, strategies)

    betManager.logMessage(config.dryRun ? 'DEVELOPMENT' : 'PRODUCTION')

    while (this.running) {
      await betManager.start()
      await driver.sleep(1500)
    }
  }

  async stop () {
    this.running = false
  }
}

new RouletteBot().start()
