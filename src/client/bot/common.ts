import { serverUrl } from '../constants'
import { Playtech } from '../driver/playtech'

import { Driver, RouletteBotConfig } from './types'

export class CommonBot {
  running: boolean
  timeStarted: number

  constructor() {
    this.running = true
    this.timeStarted = Math.floor(Date.now() / 1000)
  }

  getDriver(driverName: Driver): Playtech {
    switch (driverName) {
      case 'playtech':
        return new Playtech()
      default:
        throw new Error(`invalid driver name ${driverName}`)
    }
  }

  async getConfig(): Promise<RouletteBotConfig> {
    return fetch(`${serverUrl}/config/`)
      .then(
        resp => resp.json()
      ).catch(
        err => console.error(err)
      )
  }
}
