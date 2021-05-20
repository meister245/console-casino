import { rouletteNumbers } from '../constants';

export class StrategyCommon {

    getWinTypes(lastNumber) {
        let winTypes = []

        Object.keys(rouletteNumbers).forEach(key => {
            if (rouletteNumbers[key].includes(lastNumber)) {
                winTypes.push(key);
            }
        });

        return winTypes;
    }
}