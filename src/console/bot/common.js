export class CommonBot {
  constructor (driver) {
    this.driver = driver
    this.running = false
    this.timeStarted = Math.floor(Date.now() / 1000)
  }

  getOptions (o) {
    const options = o || {}

    const opts = {
      dryRun: true,
      bagSize: 10.0,
      chipSize: 0.10
    }

    for (const key in opts) {
      if (key in options) {
        opts[key] = options[key]
      }
    }

    return opts
  }

  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
