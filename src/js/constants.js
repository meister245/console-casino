export const gameState = {
    stageBet: 'stage-bet',
    stageSpin: 'stage-spin',
    stageWait: 'stage-wait',
    stageResults: 'stage-results'
}

export const rouletteNumbers = {
    red: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
    black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35],
    low: [...Array(18).keys()].map(n => n + 1),
    high: [...Array(18).keys()].map(n => n + 19),
    odd: [...Array(18).keys()].map(n => ((n + 1) * 2) - 1),
    even: [...Array(18).keys()].map(n => (n + 1) * 2),
    dozenFirst: [...Array(12).keys()].map(n => n + 1),
    dozenSecond: [...Array(12).keys()].map(n => n + 13),
    dozenThird: [...Array(12).keys()].map(n => n + 25),
    columnTop: [...Array(12).keys()].map(n => (n + 1) * 3),
    columnMiddle: [...Array(12).keys()].map(n => ((n + 1) * 3) - 1),
    columnBottom: [...Array(12).keys()].map(n => ((n + 1) * 3) - 2),
}
