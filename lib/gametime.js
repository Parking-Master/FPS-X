window.gametime = {
  uuidv4: function() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      let r = Math.random() * 16 | 0;
      let v = (c == "x" ? r : (r & 0x3 | 0x8));
      return v.toString(16);
    });
  },
  customServer: null,
  setCustomServer: async function(url) {
    if (url instanceof Array) {
      async function fetchServer(serverUrl) {
        try {
          let response = await fetch(serverUrl, { headers: { "ngrok-skip-browser-warning": "69420" } });
          if (response.status > 400) {
            url = url.splice(1);
            if (url[0]) {
              await fetchServer(url[0]);
            } else {
              return gametime.logger.warn("The specified socket server(s) for Gametime.js did not respond. Switching to PubNub instead.");
            }
          } else {
            gametime.customServer = {
              events: {
                message: null,
                presence: null,
              },
              url: serverUrl.trim()
            };
          }
        } catch {
          url = url.splice(1);
          if (url[0]) {
            await fetchServer(url[0]);
          } else {
            return gametime.logger.warn("The specified socket server(s) for Gametime.js did not respond. Switching to PubNub instead.");
          }
        }
      }
      await fetchServer(url[0]);
    } else {
      try {
        let response = await fetch(url, { headers: { "ngrok-skip-browser-warning": "69420" } });
        if (response.status > 400) return gametime.logger.warn("The specified socket server for Gametime.js did not respond. Switching to PubNub instead.");
      } catch {
        return gametime.logger.warn("The specified socket server for Gametime.js did not respond. Switching to PubNub instead.");
      }
      gametime.customServer = {
        events: {
          message: null,
          presence: null,
        },
        url: url.trim()
      };
    }
  },
  onconnect: null,
  ondisconnect: null,
  onsustain: null,
  verbose: true,
  cookies: {
    set: function(e, n, t) {
      let i = "";
      if (t) {
        let o = new Date;
        o.setTime(o.getTime() + 24 * t * 60 * 60 * 1e3), i = "; expires=" + o.toUTCString()
      }
      document.cookie = e + "=" + (n || "") + i + "; path=/"
    },
    get: function(cname) {
      let name = cname + "=";
      let decodedCookie = decodeURIComponent(document.cookie);
      let ca = decodedCookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return null;
    },
    channel: null,
    connecting: false
  },
  logger: {
    info: function(message) {
      if (!gametime.verbose) return;
      message = "%c[Gametime.js] - " + message.trim();
      let styling = "color: #fff !important";
      console.log(message, styling);
    },
    error: function(message) {
      if (!gametime.verbose) return;
      message = "%c[Gametime.js] - Error: " + message.trim();
      let styling = "color: #ff0000 !important";
      console.log(message, styling);
    },
    warn: function(message) {
      if (!gametime.verbose) return;
      message = "%c[Gametime.js] - Warning: " + message.trim();
      let styling = "color: gold !important";
      console.log(message, styling);
    },
    success: function(message) {
      if (!gametime.verbose) return;
      message = "%c\u2713 [Gametime.js] - " + message.trim();
      let styling = "color: #00ff00 !important";
      console.log(message, styling);
    }
  },
  on: function(event, handler) {
    gametime.pubnub.publish({
      channel: gametime.channel,
      message: `#create|${event.trim()}#${handler.toString()}`
    }, function(e, n) {});
  },
  run: function(event, parameters = [], eventCount = 1, stopWhen = null) {
    if (!(Object.keys(gametime.events).indexOf(event.trim()) > -1)) return gametime.logger.error("Couldn't find function \"" + event + "\". Create it using `gametime.on()`");
    function names(func) {
      let str = func.toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, "");
      let result = str.slice(str.indexOf("(") + 1, str.indexOf(")")).match(/([^\s,]+)/g);
      if (result == null) result = [];
      return result;
    }
    let func = encodeURIComponent(`function() { let parameters = ${JSON.stringify(parameters || [])}; let event = "${event}"; gametime.events[event.trim()].apply(this, parameters) }`);
    let pid = Math.random().toString().split(".")[1].slice(0, 4);
    gametime.pubnub.publish({
      channel: gametime.channel,
      message: `#run|${eventCount || 1},${pid}#${func.toString()}`
    }, function(e, n) {});
    if (eventCount > 1) {
      let e;
      if (stopWhen) e = setInterval(() => {
        if (eval(stopWhen)) gametime.pubnub.publish({
          channel: gametime.channel,
          message: `#kill|${pid}`
        }, function(e, n) {});
      }), clearInterval(e);
    }
  },
  pids: {},
  events: {},
  player: {
    uuid: null,
    position: 1
  },
  connectedPlayers: 0,
  players: [],
  start: (firstTime = true) => setTimeout(function() {
    gametime.logger.info("Initializing the API");
    const e = encodeURIComponent(`function() { gametime.loadTime = Date.now() - gametime.loadTime; gametime.player.uuid === "${gametime.player.uuid}" && gametime.logger.success("Successfully connected to API (" + gametime.loadTime + "ms)"); gametime.players.unshift({ uuid: "${gametime.player.uuid}", position: 1 }); if (gametime.player.uuid != "${gametime.player.uuid}" && ${firstTime}) gametime.start(false) }`);
    gametime.pubnub.publish({
      channel: gametime.channel,
      message: `#run|1,0#${e}`
    }, function(e, n) {
      if (e.error) {
        gametime.connected = false;
        gametime.logger.error("Could not connect to PubNub. Make sure your API keys are implemented right.")
      } else {
        gametime.connected = true;
        setInterval(() => {
          if (gametime.players.length >= gametime.maxPlayers && gametime.players[gametime.players.length - 1].uuid === gametime.player.uuid && gametime.players.indexOf(gametime.players.filter(player => player.uuid === gametime.player.uuid)[0]) === gametime.maxPlayers - 1) return gametime.logger.error("Could not connect to API, too many players (max: " + gametime.maxPlayers + ")"), gametime.disconnect();
        }, 2000);
        gametime.playerSetter = setInterval(() => {
          gametime.players = gametime.players.reduce(function(p, c) { if (!p.some(function (el) { return el.uuid === c.uuid })) p.push(c); return p }, []);
          gametime.connectedPlayers = Object.keys(gametime.players).length;
          gametime.players.forEach(player => gametime.players[gametime.players.indexOf(player)].position = gametime.players.map(n => n.uuid).indexOf(player.uuid) + 1);
          if (gametime.players.length > 0 && gametime.player && gametime.player.uuid && gametime.connected && gametime.players.filter(player => player.uuid === gametime.player.uuid)[0]) gametime.player = gametime.players.filter(player => player.uuid === gametime.player.uuid)[0];
        }, 100);
        gametime.logger.info("Player " + gametime.connectedPlayers + " connected");
        if (typeof gametime.onconnect === "function") {
          gametime.onconnect();
        }
      }
    });
  }, 1000),
  set: async function(key, value, e) {
    if (key === "key") {
      if (!gametime.channel && !gametime.connecting && !gametime.customServer) return gametime.logger.error("You must connect to a channel before setting your keys.");
      if (gametime.customServer) {
        await (async () => {
          await import("https://cdn.jsdelivr.net/gh/socketio/socket.io/client-dist/socket.io.js");
          let socket = io(gametime.customServer.url, {
            path: "/",
            extraHeaders: {
              "ngrok-skip-browser-warning": "69420"
            }
          });
          window.PubNub = function() {
            this.publish = function(listener, callback = () => {}) { let data = btoa(encodeURIComponent(JSON.stringify(listener))); socket.emit("data", data); callback({}) };
            this.subscribe = function() {};
            this.addListener = function(listener) {
              if (listener["message"]) {
                gametime.customServer.events["message"] = listener["message"];
              }
              if (listener["presence"]) {
                gametime.customServer.events["presence"] = listener["presence"];
              }
            }
          };
          PubNub.generateUUID = function() { return gametime.uuidv4() };
          socket.on("data", function(data) {
            let json = JSON.parse(decodeURIComponent(atob(data)));
            let call = json.message;
            if (json.channel !== gametime.channel) return;

            if (typeof gametime.customServer.events["message"] === "function") {
              let newData = {
                message: call
              };
              gametime.customServer.events["message"](newData);
            }
          });
        })();
      } else await import("https://cdn.pubnub.com/sdk/javascript/pubnub.7.3.1.min.js");
      if (!sessionStorage["pubnub-uuid"]) sessionStorage.setItem("pubnub-uuid", PubNub.generateUUID());
      gametime.player.uuid = sessionStorage["pubnub-uuid"];
      gametime.pubnub = new PubNub({
        publishKey: value,
        subscribeKey: e,
        uuid: sessionStorage["pubnub-uuid"]
      });
      gametime.pubnub.addListener({
        message: function(data) {
          let message = decodeURIComponent(data.message);
          let type = message.split("#")[1].split("#")[0].trim();
          let func = message.split("#").splice(2).join("#");
          if (type.startsWith("run")) {
            let eventCount = (type.split("|")[1] || "1,0").split(",")[0].trim() - 0;
            let pid = (type.split("|")[1] || "1,0").split(",")[1].trim() - 0;
            let i = 0;
            if (eventCount > 1) {
              let pidInterval = setInterval(() => {
                if (!(i < eventCount)) return delete gametime.pids[pid], clearInterval(pidInterval);
                i++;
                new Function("(" + func + ")()")();
              });
              gametime.pids[pid] = pidInterval;
            } else new Function("(" + func + ")()")();
          }
          if (type.startsWith("create")) gametime.events[type.split("|")[1]] = new Function(`return ${func}`)();
          if (type.startsWith("kill")) clearInterval(gametime.pids[type.split("|")[1] - 0]), delete gametime.pids[type.split("|")[1] - 0];
        },
        presence: function(data) {
          gametime.logger.info("User connected");
        }
      });
      gametime.start();
    }
    if (key === "channel") {
      gametime.connecting = true;
      let wait = setInterval(() => {
        if (!gametime.pubnub) return;
        gametime.pubnub.subscribe({
          channels: [value],
          withPresence: true
        })
        gametime.channel = value;
        gametime.connecting = false;
        clearInterval(wait);
      }, 100);
    }
  },
  disconnect: function() {
    let playerUUID = gametime.player.uuid;
    let playerIndex = gametime.players.map(player => player.uuid).indexOf(gametime.player.uuid);
    let playerPosition = gametime.player.position;
    gametime.players.splice(playerIndex, 1);
    if (gametime.pubnub.disconnect) gametime.pubnub.disconnect();
    sessionStorage.removeItem("pubnub-uuid");
    clearInterval(gametime.playerSetter);
    gametime.player = { uuid: null, position: 1 };
    gametime.logger.warn("Disconnected from API");
    gametime.disconnect = () => {};
    const e = encodeURIComponent(`function() { (typeof gametime.ondisconnect === "function" && gametime.ondisconnect()); let uuid = "${playerUUID}"; gametime.players.splice(${playerPosition}, 1); gametime.logger.warn("Player ${playerPosition} disconnected") }`);
    gametime.pubnub.publish({
      channel: gametime.channel,
      message: `#run|1,0#${e}`
    }, function(e, n) {});
  },
  sustain: async function() {
    return new Promise(function(resolve) {
      let players = gametime.players.length;
      let sustaining = setInterval(() => {
        players = gametime.players.length;
        setTimeout(() => {
          if (gametime.sustained) return resolve(), clearInterval(sustaining);
          if (players === gametime.players.length && !gametime.sustained) resolve(), (typeof gametime.onsustain === "function" && gametime.onsustain()), clearInterval(sustaining);
        }, 2000);
      }, 2000);
    });
  },
  wait: async function(players) {
    return new Promise(function(resolve) {
      let connected = setInterval(() => {
        if (gametime.connectedPlayers === players) resolve(), clearInterval(connected);
      }, 2000);
    });
  },
  sustained: false,
  playerSetter: 0,
  maxPlayers: 16
};

// Set the time token before leaving the page
window.addEventListener("beforeunload", () => {
  gametime.cookies.set("pubnub-time-token", `${new Date().getTime()}0000`, 10);
});

window.addEventListener("load", () => {
  gametime.loadTime = Date.now();
});
