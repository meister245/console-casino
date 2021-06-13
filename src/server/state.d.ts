export interface GameState {
    active: boolean
    suspended: boolean
    betSize?: number
    betStrategy?: string
    tableName?: string
}