import { serverUrl } from '../constants'

export class BetManager {
  async requestBet () {
    return fetch(`${serverUrl}/bet/`, {
      method: 'POST',
      mode: 'cors'
    }).then(
      resp => resp.json()
    ).catch(
      err => console.error(err)
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
    ).catch(
      err => console.error(err)
    )
  }
}
