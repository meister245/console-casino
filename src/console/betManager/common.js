import { serverUrl } from '../constants'

export class BetManager {
  constructor () {
    this.lastBetTime = Math.floor(Date.now() / 1000)
  }

  async requestBet () {
    return fetch(`${serverUrl}/bet/`, {
      method: 'POST',
      mode: 'cors'
    }).then(
      resp => resp.json()
    )
  }

  async reportResult (result, gameState) {
    if (!['win', 'lose', 'abort'].includes(result)) {
      throw new Error('invalid result')
    }

    const data = {
      result: result,
      strategy: gameState?.strategy,
      multiplier: gameState?.multiplier.current
    }

    return fetch(`${serverUrl}/result/`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data })
    }).then(
      resp => resp.json()
    )
  }

  updateLastBetTime () {
    this.lastBetTime = Math.floor(Date.now() / 1000)
  }
}
