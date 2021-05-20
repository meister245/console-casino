export class DriverCommon {

    getBalance() {
        throw new Error('abstract method');
    }

    getBetAmount() {
        throw new Error('abstract method');
    }

    getDealerMessage() {
        throw new Error('abstract method');
    }

    getDealerName() {
        throw new Error('abstract method');
    }

    getExtendedHistory() {
        throw new Error('abstract method');
    }

    getLastNumber() {
        throw new Error('abstract method');
    }

    getLastNumbers() {
        throw new Error('abstract method');
    }

    getWinAmount() {
        throw new Error('abstract method');
    }

    setBet() {
        throw new Error('abstract method');
    }

    setBetDouble() {
        throw new Error('abstract method');
    }

    setBetUndo() {
        throw new Error('abstract method');
    }

    setChipSize() {
        throw new Error('abstract method');
    }

    viewStatistics() {
        throw new Error('abstract method');
    }

    viewExtendedHistory() {
        throw new Error('abstract method');
    }

    simulatedClick(target, o) {
        let event = target.ownerDocument.createEvent('MouseEvents'),
            options = o || {},
            opts = {
                type: 'click',
                canBubble: true,
                cancelable: true,
                view: target.ownerDocument.defaultView,
                detail: 1,
                screenX: 0,
                screenY: 0,
                clientX: 0,
                clientY: 0,
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                button: 0,
                relatedTarget: null,
            };

        for (let key in options) {
            if (options.hasOwnProperty(key)) {
                opts[key] = options[key];
            }
        }

        event.initMouseEvent(
            opts.type,
            opts.canBubble,
            opts.cancelable,
            opts.view,
            opts.detail,
            opts.screenX,
            opts.screenY,
            opts.clientX,
            opts.clientY,
            opts.ctrlKey,
            opts.altKey,
            opts.shiftKey,
            opts.metaKey,
            opts.button,
            opts.relatedTarget
        );

        target.dispatchEvent(event);
    }
}