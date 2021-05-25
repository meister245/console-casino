import { serverUrl } from '../constants'

export class CommonBot {
  constructor (driver) {
    this.driver = driver
    this.running = false
    this.timeStarted = Math.floor(Date.now() / 1000)
  }

  async getConfig (name) {
    return fetch(`${serverUrl}/config/?game=${name}`)
      .then(resp => resp.json())
  }
}
