export const rouletteStrategy = {
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
  },
  dozenFirstHighOccurrence: {
    bets: ['dozenSecond', 'dozenThird'],
    progression: 'martingale',
    stopLossLimit: 6,
    trigger: {
      pattern: ['dozenFirst', 'dozenFirst'],
      distribution: ['dozenFirst', 100, 36, 'higherEqual']
    }
  },
  dozenSecondHighOccurrence: {
    bets: ['dozenFirst', 'dozenThird'],
    progression: 'martingale',
    stopLossLimit: 6,
    trigger: {
      pattern: ['dozenSecond', 'dozenSecond'],
      distribution: ['dozenSecond', 100, 36, 'higherEqual']
    }
  },
  dozenThirdHighOccurrence: {
    bets: ['dozenFirst', 'dozenSecond'],
    progression: 'martingale',
    betLossLimit: 6,
    trigger: {
      pattern: ['dozenThird', 'dozenThird'],
      distribution: ['dozenThird', 100, 36, 'higherEqual']
    }
  },
  columnTopHighOccurrence: {
    bets: ['columnMiddle', 'columnBottom'],
    progression: 'martingale',
    stopLossLimit: 6,
    trigger: {
      pattern: ['columnTop', 'columnTop'],
      distribution: ['columnTop', 100, 36, 'higherEqual']
    }
  },
  columnMiddleHighOccurrence: {
    bets: ['columnTop', 'columnBottom'],
    progression: 'martingale',
    stopLossLimit: 6,
    trigger: {
      pattern: ['columnMiddle', 'columnMiddle'],
      distribution: ['columnMiddle', 100, 36, 'higherEqual']
    }
  },
  columnBottomHighOccurrence: {
    bets: ['columnTop', 'columnMiddle'],
    progression: 'martingale',
    stopLossLimit: 6,
    trigger: {
      pattern: ['columnBottom', 'columnBottom'],
      distribution: ['columnBottom', 100, 36, 'higherEqual']
    }
  }
}
