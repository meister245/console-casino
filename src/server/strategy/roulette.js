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
  },
  dozenFirstHighOccurrence: {
    bets: ['dozenSecond', 'dozenThird'],
    progressionMultiplier: 3,
    stopLossLimit: 5,
    trigger: {
      pattern: ['dozenFirst', 'dozenFirst', 'dozenFirst', 'dozenFirst'],
      distribution: ['dozenFirst', 100, 36, 'higherEqual']
    }
  },
  dozenSecondHighOccurrence: {
    bets: ['dozenFirst', 'dozenThird'],
    progressionMultiplier: 3,
    stopLossLimit: 5,
    trigger: {
      pattern: ['dozenSecond', 'dozenSecond', 'dozenSecond', 'dozenSecond'],
      distribution: ['dozenSecond', 100, 36, 'higherEqual']
    }
  },
  dozenThirdHighOccurrence: {
    bets: ['dozenFirst', 'dozenSecond'],
    progressionMultiplier: 3,
    betLossLimit: 5,
    trigger: {
      pattern: ['dozenThird', 'dozenThird', 'dozenThird', 'dozenThird'],
      distribution: ['dozenThird', 100, 36, 'higherEqual']
    }
  },
  columnTopHighOccurrence: {
    bets: ['columnMiddle', 'columnBottom'],
    progressionMultiplier: 3,
    stopLossLimit: 5,
    trigger: {
      pattern: ['columnTop', 'columnTop', 'columnTop', 'columnTop'],
      distribution: ['columnTop', 100, 36, 'higherEqual']
    }
  },
  columnMiddleHighOccurrence: {
    bets: ['columnTop', 'columnBottom'],
    progressionMultiplier: 3,
    stopLossLimit: 5,
    trigger: {
      pattern: ['columnMiddle', 'columnMiddle', 'columnMiddle', 'columnMiddle'],
      distribution: ['columnMiddle', 100, 36, 'higherEqual']
    }
  },
  columnBottomHighOccurrence: {
    bets: ['columnTop', 'columnMiddle'],
    progressionMultiplier: 3,
    stopLossLimit: 5,
    trigger: {
      pattern: ['columnBottom', 'columnBottom', 'columnBottom', 'columnBottom'],
      distribution: ['columnBottom', 100, 36, 'higherEqual']
    }
  }
}
