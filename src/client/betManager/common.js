import { serverUrl } from '../constants'

export class BetManager {
  async getServerState () {
    return fetch(`${serverUrl}/state/`)
      .then(
        resp => resp.json()
      ).catch(
        err => console.error(err)
      )
  }

  async betRequest (data) {
    return fetch(`${serverUrl}/bet/`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(
      resp => resp.json()
    ).catch(
      err => console.error(err)
    )
  }

  async betInit (strategyName, tableName) {
    return await this.betRequest({
      action: 'init', strategyName, tableName
    })
  }

  async betUpdate (betSize, tableName) {
    return await this.betRequest({
      action: 'update', betSize, tableName
    })
  }

  async betSuspend (betSize, tableName) {
    return await this.betRequest({
      action: 'suspend', betSize, tableName
    })
  }

  async betReset (gameResult, gameState, tableName) {
    if (!['win', 'lose', 'abort'].includes(gameResult)) {
      throw new Error('invalid result')
    }

    return await this.betRequest({
      action: 'reset',
      tableName,
      result: gameResult,
      strategy: gameState?.strategy,
      multiplier: gameState?.progressionCount
    })
  }
}
