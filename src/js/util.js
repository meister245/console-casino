export function getElementByAttribute(attr, value, root) {
    root = root || document.body;
    if (root.hasAttribute(attr) && root.getAttribute(attr) === value) {
        return root;
    }
    let children = root.children,
        element;
    for (let i = children.length; i--;) {
        element = this.getElementByAttribute(attr, value, children[i]);
        if (element) {
            return element;
        }
    }
    return null;
}

export function simulatedClick(target, o) {
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

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}