import { RouletteBot } from './bot/roulette'
import { Playtech } from './driver/playtech'

export class ConsoleCasino {
  constructor (driverName) {
    this.roulette = new RouletteBot(this.getDriver(driverName))
  }

  getDriver (driverName) {
    switch (driverName) {
      case 'playtech':
        return new Playtech()
      default:
        throw new Error(`invalid driver name ${driverName}`)
    }
  }
}
