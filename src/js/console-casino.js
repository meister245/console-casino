import { RouletteBot } from './bot/roulette'
import { Playtech } from './driver/playtech'

export class ConsoleCasino {
  constructor (driverName) {
    this.drivers = ['playtech']
    this.roulette = new RouletteBot(this.getDriver(driverName))
  }

  getDriver (driverName) {
    const allDrivers = ConsoleCasino.getDrivers()

    if (!allDrivers.includes(driverName)) {
      throw new Error(`invalid driver name ${driverName}`)
    }

    if (driverName === 'playtech') {
      return new Playtech()
    }
  }
}
