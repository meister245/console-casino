class DriverCommon {
  simulatedClick(target: HTMLElement): void {
    const event = target.ownerDocument.createEvent("MouseEvents");
    const opts = {
      type: "click",
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
      relatedTarget: null as EventTarget | null,
    };

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

  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default DriverCommon;
