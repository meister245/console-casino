export class BetManager {
  constructor () {
    this.lastBetTime = null
  }

  updateLastBetTime () {
    this.lastBetTime = Math.floor(Date.now() / 1000)
  }
}
