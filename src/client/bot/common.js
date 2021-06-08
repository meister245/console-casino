import { serverUrl } from '../constants'

export class CommonBot {
  constructor (driver) {
    this.driver = driver
    this.running = false
    this.timeStarted = Math.floor(Date.now() / 1000)
  }

  async getConfig () {
    const tableName = this.driver.getTableName()

    return fetch(`${serverUrl}/config/?tableName=${tableName}`)
      .then(
        resp => resp.json()
      ).catch(
        err => console.error(err)
      )
  }
}
