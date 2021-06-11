interface GameState {
  active: boolean
  suspended: boolean
  betSize?: number
  betStrategy?: string
  tableName?: string
}

export const gameState: GameState = {
  active: false,
  suspended: false,
  betSize: undefined,
  betStrategy: undefined,
  tableName: undefined
}

export const resetGameState = () => {
  gameState.active = false
  gameState.suspended = false
  gameState.betSize = undefined
  gameState.betStrategy = undefined
  gameState.tableName = undefined
}

export const initGameState = (strategyName: string, tableName: string) => {
  gameState.active = true
  gameState.suspended = false
  gameState.betStrategy = strategyName
  gameState.tableName = tableName
}

export const updateGameState = (betSize: number) => {
  gameState.betSize = betSize
}

export const suspendGameState = (betSize: number, betStrategy: string) => {
  gameState.active = false
  gameState.suspended = true
  gameState.betSize = betSize
  gameState.betStrategy = betStrategy
  gameState.tableName = undefined
}

export const resumeSuspendedGameState = (strategyName: string, tableName: string) => {
  gameState.active = true
  gameState.suspended = true
  gameState.betStrategy = strategyName
  gameState.tableName = tableName
}
