import { serverUrl } from '../constants'
import { Playtech } from '../driver/playtech'

export enum GameResult {
  WIN = 'win',
  LOSE = 'lose',
  ABORT = 'abort'
}

export enum BetRequestAction {
  INIT = 'init',
  UPDATE = 'update',
  SUSPEND = 'suspend',
  RESET = 'reset'
}

export interface GameState {
  bets: string[]
  betSize: number
  betStrategy: string,
  suspended: boolean,
  progressionCount: number
  progressionMultiplier: number
  stopWinLimit: number
  stopLossLimit: number
  suspendLossLimit: number
}

interface BetRequestProps {
  action: BetRequestAction
  betStrategy?: string
  betMultiplier?: number
  betSize?: number
  tableName?: string
  result?: GameResult
}

export class BetManager {
  driver: Playtech

  constructor (driver: Playtech) {
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

  async betRequest (data: BetRequestProps) {
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

  async betInit (betStrategy: string, tableName: string) {
    return await this.betRequest({
      action: BetRequestAction.INIT, betStrategy, tableName
    })
  }

  async betUpdate (betSize: number, tableName: string) {
    return await this.betRequest({
      action: BetRequestAction.UPDATE, betSize, tableName
    })
  }

  async betSuspend (betSize: number, betStrategy: string, tableName: string) {
    return await this.betRequest({
      action: BetRequestAction.SUSPEND, betSize, betStrategy, tableName
    })
  }

  async betReset (gameResult: GameResult, gameState: GameState, tableName: string) {
    return await this.betRequest({
      action: BetRequestAction.RESET,
      tableName,
      result: gameResult,
      betStrategy: gameState?.betStrategy,
      betMultiplier: gameState?.progressionCount
    })
  }
}
