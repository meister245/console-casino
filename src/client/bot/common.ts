import { serverUrl } from '../constants'
import { Playtech } from '../driver/playtech'

export class CommonBot {
  running: boolean
  timeStarted: number

  constructor () {
    this.running = true
    this.timeStarted = Math.floor(Date.now() / 1000)
  }

  async getDriver (driverName: string) {
    switch (driverName) {
      case 'playtech':
        return new Playtech()
      default:
        throw new Error(`invalid driver name ${driverName}`)
    }
  }

  async getConfig () {
    return fetch(`${serverUrl}/config/`)
      .then(
        resp => resp.json()
      ).catch(
        err => console.error(err)
      )
  }
}
