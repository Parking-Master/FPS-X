user = {
  preferences: {
    game: {
      character: "SWAT",
      loadout: ["AK-74", "FN-502"],
      performanceOptimization: "off",
      mouseSpeed: 2,
      gamepadSpeed: 1,
      touchSpeed: 2,
      keyBindings: {
        walkforward: "KeyW",
        walkleft: "KeyA",
        walkbackward: "KeyS",
        walkright: "KeyD",
        shoot: "KeyF",
        reload: "KeyR",
        zoom: "KeyI",
        melee: "KeyB",
        switchweapon: "KeyY",
        throwgrenade: "KeyG",
        interact: "KeyE",
        jump: "Space",
        sprint: "ShiftLeft"
      },
      gamepadBindings: {
        shoot: "rt",
        reload: "rb",
        zoom: "r",
        melee: "b",
        switchweapon: "y",
        throwgrenade: "lt",
        interact: "rb",
        jump: "a",
        sprint: "x"
      }
    },
  },
  set: function(key, value) {
    let currentObject = user.preferences;

    key.split(".").forEach((objectName, index) => {
      if (index >= key.split(".").length - 1) return currentObject[objectName] = value;
      currentObject = currentObject[objectName];
    });

    user.save();
  },
  save: function() {
    localStorage.setItem("user-preferences", JSON.stringify(user.preferences));
  },
  logIn: function(userData) {
    let oldData = user;
    user = userData;
    user.oldData = oldData;
    if (oldData.logInCallback) user.logInCallback = oldData.logInCallback;

    let loginToken = localStorage["loginToken"];
    user.set = function(key, value) {
      fetch("https://hardy-beetle-free.ngrok-free.app/account/modify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: loginToken,
          key: key,
          value: value
        })
      });

      if (key === "root:username") {
        user.username = value;
      } else {
        let currentObject = user.preferences;

        key.split(".").forEach((objectName, index) => {
          if (index >= key.split(".").length - 1) return currentObject[objectName] = value;
          currentObject = currentObject[objectName];
        });
      }
    };
    user.save = () => {};
    user.logOut = function() {
      user = user.oldData;
      localStorage.removeItem("loginToken");
      localStorage.removeItem("user-login-cache");
    };

    localStorage.setItem("user-login-cache", JSON.stringify({
      username: user.username
    }));
  }
};

if (localStorage["user-preferences"]) {
  let savedPreferences = JSON.parse(localStorage["user-preferences"]);
  user.preferences = savedPreferences;
} else {
  user.save();
}

function fetchUserData() {
  if (localStorage["loginToken"]) {
    user.loggedIn = true;

    let loginToken = localStorage["loginToken"];
    let userCache = localStorage["user-login-cache"];
    if (userCache) {
      userCache = JSON.parse(userCache);
      user.username = userCache.username;
    }
  
    fetch("https://hardy-beetle-free.ngrok-free.app/account/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420"
      },
      body: JSON.stringify({
        token: loginToken
      })
    }).then(response => response.json()).then(userData => {
      user.logIn(userData);
      user.loggedIn = true;

      if (typeof user.logInCallback === "function") user.logInCallback();
    });
  } else {
    user.loggedIn = false;
  }
}
fetchUserData();