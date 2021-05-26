module.exports = {
  redLowOccurrence: {
    bets: ['red'],
    progression: 'martingale',
    stopLossLimit: 8,
    trigger: {
      pattern: ['black', 'black'],
      distribution: ['red', 100, 40, 'lowerEqual']
    }
  },
  blackLowOccurrence: {
    bets: ['black'],
    progression: 'martingale',
    stopLossLimit: 8,
    trigger: {
      pattern: ['red', 'red'],
      distribution: ['black', 100, 40, 'lowerEqual']
    }
  },
  evenLowOccurrence: {
    bets: ['even'],
    progression: 'martingale',
    stopLossLimit: 8,
    trigger: {
      pattern: ['odd', 'odd'],
      distribution: ['even', 100, 40, 'lowerEqual']
    }
  },
  oddLowOccurrence: {
    bets: ['odd'],
    progression: 'martingale',
    stopLossLimit: 8,
    trigger: {
      pattern: ['even', 'even'],
      distribution: ['odd', 100, 40, 'lowerEqual']
    }
  },
  lowLowOccurrence: {
    bets: ['low'],
    progression: 'martingale',
    stopLossLimit: 8,
    trigger: {
      pattern: ['high', 'high'],
      distribution: ['low', 100, 40, 'lowerEqual']
    }
  },
  highLowOccurrence: {
    bets: ['high'],
    progression: 'martingale',
    stopLossLimit: 8,
    trigger: {
      pattern: ['low', 'low'],
      distribution: ['high', 100, 40, 'lowerEqual']
    }
  }
}
