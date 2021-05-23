export class CommonBot {
  constructor (driver) {
    this.driver = driver
    this.running = false
    this.timeStarted = Math.floor(Date.now() / 1000)
  }

  async getConfig (o) {
    const config = o || {}

    return fetch('http://localhost:8080/config/')
      .then(resp => resp.json())
      .then(data => {
        for (const key in data) {
          if (key in config) {
            data[key] = config[key]
          }
        }
        return data
      })
  }

  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
