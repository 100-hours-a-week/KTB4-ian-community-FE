if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (callback) => callback();
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
