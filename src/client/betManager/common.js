import { serverUrl } from '../constants'

export class BetManager {
  constructor (driver) {
    this.driver = driver
  }

  async getServerState () {
    const tableName = this.driver.getTableName()
    const source = tableName.replace(/\s/, '-').toLowerCase()

    return fetch(`${serverUrl}/state/?tableName=${source}`)
      .then(
        resp => resp.json()
      ).catch(
        err => console.error(err)
      )
  }

  async betRequest (data) {
    const tableName = this.driver.getTableName()

    return fetch(`${serverUrl}/bet/?tableName=${tableName}`, {
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

  async betSuspend (betSize, betStrategy, tableName) {
    return await this.betRequest({
      action: 'suspend', betSize, betStrategy, tableName
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
