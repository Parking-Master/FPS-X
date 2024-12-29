(function() {
  let overlay = document.createElement("div");
  overlay.className = "loading-overlay";
  document.body.insertBefore(overlay, document.body.firstChild);

  let wrapper = document.createElement("div");
  wrapper.className = "loading-screen";
  document.body.insertBefore(wrapper, document.body.firstChild);
  
  wrapper.innerHTML = `
  <div class="context-menu">
  <h2 class="title">Starting the game</h2>
  <div class="loading-status" id="resources">
    <div class="loading-banner">
      <div class="loading-spinner"></div> <span class="loading-status-title">Load and compile resources [0/20]</span>
    </div>
  <pre class="code-block"></pre>
  </div>
  <br>
  <div class="loading-status" id="variables">
    <div class="loading-banner">
      <div class="loading-spinner paused"></div> <span class="loading-status-title">Set game variables [0/70]</span>
    </div>
  </div>
  <br>
  <div class="loading-status" id="objectsrendered">
    <div class="loading-banner">
      <div class="loading-spinner paused"></div> <span class="loading-status-title">Render off-screen objects [0/2]</span>
    </div>
  </div>
  <br>
  <div class="loading-status" id="render">
    <div class="loading-banner">
      <div class="loading-spinner paused"></div> <span class="loading-status-title">Begin rendering [0/2]</span>
    </div>
  </div>
  <br>
  <div class="loading-status" id="setup">
    <div class="loading-banner">
      <div class="loading-spinner paused"></div> <span class="loading-status-title">Set spawn and weapons [0/2]</span>
    </div>
  </div>
  </div>
  <div class="player-menu">
  <div class="map-preview"></div>
  <div class="players-current">
    Number of players: <span class="players-current-count">0</span>
    <br>
    Players needed to start: <span class="players-needed-count">2</span>
    <hr class="player-menu-hr">
    <div class="player-list">
      <div class="player-left-column">
        <div class="player empty-player">Empty spot</div>
        <div class="player empty-player">Empty spot</div>
        <div class="player empty-player">Empty spot</div>
        <div class="player empty-player">Empty spot</div>
      </div>
      <div class="player-right-column">
        <div class="player empty-player">Empty spot</div>
        <div class="player empty-player">Empty spot</div>
        <div class="player empty-player">Empty spot</div>
        <div class="player empty-player">Empty spot</div>
      </div>
    </div>
  </div>
  </div>
  `;
  
  window.requestsStarted = {};
  window.requestsFinished = {};
  
  function logRequest(entry) {
    const url = entry.name;
    if (entry.entryType === 'resource' && !Object.keys(requestsFinished).includes(url)) {
      requestsStarted[url] = {
        timestamp: Date.now(),
        url: url,
        finished: false
      };
      updateLoader();
    }
  }
  
  function logRequestCompletion(entry) {
    const url = entry.name;
    if (entry.entryType === 'resource' && !Object.keys(requestsFinished).includes(url)) {
      requestsStarted[url].finished = true;
      requestsFinished[url] = {
        url: url
      };
    }
  }
  
  const observerStart = new PerformanceObserver((list) => {
    list.getEntries().forEach(logRequest);
  });
  
  const observerEnd = new PerformanceObserver((list) => {
    list.getEntries().forEach(logRequestCompletion);
  });
  
  observerStart.observe({ entryTypes: ['resource'] });
  observerEnd.observe({ entryTypes: ['resource'] });
  
  document.head.innerHTML += `
  <style>
  .loading-overlay {
    position: fixed;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    background: #000;
    z-index: 2147483646;
  }
  .loading-screen {
    position: fixed;
    z-index: 2147483647;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    margin: 0;
  }
  @font-face {
    font-family: "FilsonPro";
    src: url(/fonts/FilsonProRegular-Regular.otf);
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  .context-menu {
    position: absolute;
    background: #1e2025;
    width: 500px;
    height: 100%;
    left: 0;
    top: 0;
    bottom: 0;
    margin: 0;
  }
  .context-menu h2.title {
    color: #ddd;
    font-size: 40px;
    text-align: center;
    font-family: "FilsonPro";
  }
  .loading-status {
    position: relative;
    text-align: left;
    width: 320px;
    left: 50%;
    margin-left: -160px;
    color: #ddd;
    font-size: 16px;
    font-family: Arial, Helvetica, sans-serif;
  }
  .loading-status .loading-status-title, .loading-status .loading-status-current {
    display: inline-block;
  }
  .loading-spinner {
    border: 2px solid #f5f5f5;
    border-radius: 50%;
    border-top: 2px solid #1e2025;
    width: 10px;
    height: 10px;
    animation: spin 1.5s linear infinite;
    margin-right: 10px;
    line-height: 16px;
    vertical-align: middle;
    display: inline-block;
    margin-top: -2px;
  }
  .loading-spinner.paused {
    animation: none;
    background: rgb(255, 208, 0);
    border: none;
    margin-top: -4px;
  }
  .loading-spinner.complete {
    animation: none;
    border: none;
    margin-top: -8px;
  }
  .loading-spinner.complete::before {
    content: "\\f00c";
    font-family: "FontAwesome";
    color: #39a845;
  }
  .code-block {
    background: #303237;
    padding: 10px;
    font-family: monospace;
    overflow-x: scroll;
  }
  .cross {
    color: #ff0000;
    font-size: 15px;
  }
  .check {
    color: #39a845;
    font-size: 15px;
  }
  .map-preview {
    position: relative;
    background-image: none;
    background-size: cover;
    background-repeat: no-repeat;
    width: auto;
    height: 60vh;
    top: 0;
    right: 0;
  }
  .player-menu {
    position: absolute;
    background: #1e2025;
    width: calc(100% - 500px);
    height: 100%;
    right: 0;
    bottom: 0;
    margin: 0;
    height: 100%;
    font-family: Arial, Helvetica, sans-serif;
  }
  .player-menu .players-current {
    position: relative;
    color: #ddd;
    bottom: 0;
    left: 0;
    top: 10px;
  }
  .player-list .player {
    width: 200px;
    padding: 5px;
    background: #303237;
    margin-left: 0;
    padding-left: 0;
    margin-bottom: 10px;
    text-align: center;
    font-family: "Arame", Arial;
  }
  .player-list .player.empty-player {
    background: transparent;
    border: 1px solid #eee;
  }
  .player-right-column {
    position: relative;
    display: inline-block;
  }
  .player-left-column {
    position: relative;
    display: inline-block;
  }
  hr.player-menu-hr {
    border: none;
    background: #ddd;
    height: 2px;
  }
  </style>
  `;
  
  let loader = document.querySelector(".context-menu");
  let step = 0;
  let finishedSteps = [];
  let joinedPlayers = [];
  function finishStep(step, purge = false) {
    if (!finishedSteps.includes(step) || purge) {
      finishedSteps.push(step);
      if (step == 0) {
        loader.querySelector(".loading-status#resources").querySelector(".loading-status-title").textContent = `Load and compile resources [180/180]`;
        loader.querySelector(".loading-status#resources").querySelector(".loading-spinner").classList.add("complete");
      } else if (step == 1) {
        loader.querySelector(".loading-status#variables").querySelector(".loading-status-title").textContent = `Set game variables [70/70]`;
        loader.querySelector(".loading-status#variables").querySelector(".loading-spinner").classList.add("complete");
      } else if (step == 2) {
        loader.querySelector(".loading-status#objectsrendered").querySelector(".loading-status-title").textContent = `Render off-screen objects [2/2]`;
        loader.querySelector(".loading-status#objectsrendered").querySelector(".loading-spinner").classList.add("complete");
      } else if (step == 3) {
        loader.querySelector(".loading-status#render").querySelector(".loading-status-title").textContent = `Begin rendering [2/2]`;
        loader.querySelector(".loading-status#render").querySelector(".loading-spinner").classList.add("complete");
      } else if (step == 4) {
        loader.querySelector(".loading-status#setup").querySelector(".loading-status-title").textContent = `Set spawn and weapons [2/2]`;
        loader.querySelector(".loading-status#setup").querySelector(".loading-spinner").classList.add("complete");
      }
    }
  }
  function updateLoader() {
    if (step == 0) {
      loader.querySelector(".loading-status#resources").querySelector(".loading-spinner").className = "loading-spinner";
      document.querySelector(".code-block").innerHTML = "";
      for (i in requestsStarted) {
        let request = requestsStarted[i];
        if (Object.keys(requestsStarted).indexOf(i) >= Object.keys(requestsStarted).length - 5) {
          loader.querySelector(".loading-status#resources").querySelector(".loading-status-title").textContent = `Load and compile resources [${Object.keys(requestsFinished).length}/180]`;
          if (!request.finished) {
            document.querySelector(".code-block").innerHTML += `
└ <span class="cross"><i class="fa fa-times"></i></span> GET ${request.url}
`;
          } else {
            document.querySelector(".code-block").innerHTML += `
└ <span class="check"><i class="fa fa-check"></i></span> GET ${request.url}
`;
          }
        }
      }
    } else if (step == 1) {
      finishStep(0);
      loader.querySelector(".loading-status#variables").querySelector(".loading-spinner").className = "loading-spinner";
    } else if (step == 2) {
      finishStep(0);
      finishStep(1);
      loader.querySelector(".loading-status#objectsrendered").querySelector(".loading-spinner").className = "loading-spinner";
      if (!utils.options.get("ObjectsRendered")) {
        utils.options.set("ObjectsRendered", true);
        plugins.waitUntil(() => sandbox.models.explosion.model !== null).then(() => {
          sandbox.models.explosion.model.position.copy(camera.position);
          scene.add(sandbox.models.explosion.model);
          setTimeout(() => scene.remove(sandbox.models.explosion.model), 1500);
        });
      }
    } else if (step == 3) {
      finishStep(0);
      finishStep(1);
      finishStep(2);
      loader.querySelector(".loading-status#render").querySelector(".loading-spinner").className = "loading-spinner";
    } else if (step == 4) {
      finishStep(0);
      finishStep(1);
      finishStep(2);
      finishStep(3);
      loader.querySelector(".loading-status#setup").querySelector(".loading-spinner").className = "loading-spinner";
    } else if (step == 5) {
      clearInterval(loadscreenUpdater);
      finishStep(0, true);
      finishStep(1, true);
      finishStep(2, true);
      finishStep(3, true);
      finishStep(4, true);
      LoadingManager.finished = true;
      if (typeof window.LoadingManager.onfinish === "function") window.LoadingManager.onfinish();
    }
  
    if (Object.keys(requestsStarted).length !== Object.keys(requestsFinished).length && step < 4) {
      step = 0;
    } else if (typeof map === "undefined") {
      step = 1;
    } else if (!utils.options.get("ObjectsRendered")) {
      step = 2;
    } else if (lastRuntime == 0) {
      step = 3;
    } else if (!utils.options.get("SetupComplete")) {
      step = 4;
    } else {
      step = 5;
    }
  }
  updateLoader();
  
  let loadscreenUpdater = setInterval(() => {
    updateLoader();
  }, 100);

  async function playerJoin(uuid, username) {
    let nextSpot = document.querySelector(".player.empty-player");
    nextSpot.textContent = username;
    nextSpot.classList.remove("empty-player");
    joinedPlayers.push(uuid);
    document.querySelector(".players-current-count").textContent = joinedPlayers.length;

    if (joinedPlayers.length >= window.LoadingManager.playersNeededToStart) {
      await plugins.waitUntil(() => LoadingManager.finished);
      gameStart();
    }
  }

  async function gameStart() {
    window.LoadingManager.playerJoin = () => {};
    await plugins.realDelay(5000);

    wrapper.style.opacity = 1;
    new TWEEN.Tween(wrapper.style).to({ opacity: 0 }, 2000).easing(TWEEN.Easing.Quadratic.Out).start();
    await plugins.realDelay(3000);
    overlay.style.opacity = 1;
    new TWEEN.Tween(overlay.style).to({ opacity: 0 }, 250).easing(TWEEN.Easing.Quadratic.In).start();

    window.LoadingManager.oncountdown();
  }

  window.LoadingManager = {
    finished: false,
    remove: function() {
      wrapper.remove();
      overlay.remove();
    },
    onfinish: null,
    oncountdown: null,
    playerJoin: playerJoin,
    playersNeededToStart: 2,
    setMapPreview: function(map) {
      document.querySelector(".map-preview").style.backgroundImage = `url(/images/other/maps/${map}.png)`;
    }
  };

  document.querySelector(".players-needed-count").textContent = window.LoadingManager.playersNeededToStart;
})();