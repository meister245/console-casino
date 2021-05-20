export class CommonBot {
  getOptions (o) {
    const options = o || {}

    const opts = {
      dryRun: true,
      chipSize: 0.20
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
