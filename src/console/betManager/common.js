export class BetManager {
  constructor () {
    this.lastBetTime = Math.floor(Date.now() / 1000)
  }

  updateLastBetTime () {
    this.lastBetTime = Math.floor(Date.now() / 1000)
  }
}
