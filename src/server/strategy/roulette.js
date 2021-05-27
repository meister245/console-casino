module.exports = {
  redLowOccurrence: {
    bets: ['red'],
    progressionMultiplier: 2,
    stopLossLimit: 8,
    trigger: {
      pattern: ['black', 'black'],
      distribution: ['red', 100, 40, 'lowerEqual']
    }
  },
  blackLowOccurrence: {
    bets: ['black'],
    progressionMultiplier: 2,
    stopLossLimit: 8,
    trigger: {
      pattern: ['red', 'red'],
      distribution: ['black', 100, 40, 'lowerEqual']
    }
  },
  evenLowOccurrence: {
    bets: ['even'],
    progressionMultiplier: 2,
    stopLossLimit: 8,
    trigger: {
      pattern: ['odd', 'odd'],
      distribution: ['even', 100, 40, 'lowerEqual']
    }
  },
  oddLowOccurrence: {
    bets: ['odd'],
    progressionMultiplier: 2,
    stopLossLimit: 8,
    trigger: {
      pattern: ['even', 'even'],
      distribution: ['odd', 100, 40, 'lowerEqual']
    }
  },
  lowLowOccurrence: {
    bets: ['low'],
    progressionMultiplier: 2,
    stopLossLimit: 8,
    trigger: {
      pattern: ['high', 'high'],
      distribution: ['low', 100, 40, 'lowerEqual']
    }
  },
  highLowOccurrence: {
    bets: ['high'],
    progressionMultiplier: 2,
    stopLossLimit: 8,
    trigger: {
      pattern: ['low', 'low'],
      distribution: ['high', 100, 40, 'lowerEqual']
    }
  }
}
