window.plugins = {
  delay: async function(timeout) {
    return new Promise(function(resolve) {
      setTimeout(() => resolve(), timeout);
    });
  },
  realDelay: async function(timeout) {
    return new Promise(async function(resolve) {
      let ms = Date.now();
      await plugins.waitUntil(() => Date.now() - ms >= timeout);
      resolve();
    });
  },
  intervalIds: {},
  timeoutIds: {},
  realInterval: function(handler, timeout, instant = false) {
    if (instant) handler();
    let id = Object.keys(plugins.intervalIds).length;
    plugins.intervalIds[id] = {
      running: true
    };
    (async () => {
      for (let i = 0; i < Infinity; i++) {
        if (!plugins.intervalIds[id].running) {
          delete plugins.intervalIds[id];
          break;
        }
        await plugins.realDelay(timeout);
        handler();
      }
    })();

    return id;
  },
  realTimeout: function(handler, timeout) {
    let id = Object.keys(plugins.timeoutIds).length;
    plugins.timeoutIds[id] = {
      running: true
    };
    (async () => {
      function finish() {
        delete plugins.timeoutIds[id];
      }

      await plugins.realDelay(timeout);
      if (!plugins.timeoutIds[id]) return;
      if (!plugins.timeoutIds[id].running) return finish();
      handler();
      finish();
    })();

    return id;
  },
  clearRealInterval: function(id) {
    if (!plugins.intervalIds[id]) return;
    plugins.intervalIds[id].running = false;
  },
  clearRealTimeout: function(id) {
    if (!plugins.timeoutIds[id]) return;
    plugins.timeoutIds[id].running = false;
  },
  noDelayInterval: function(handler = () => {}, timeout = 0) {
    handler();
    return setInterval.apply(null, arguments);
  },
  waitUntil: async function(condition, timeout = 0) {
    return new Promise(function(resolve) {
      function loop() {
        if (condition()) return resolve();
        setTimeout(loop, timeout);
      }
      loop();
    });
  }
};