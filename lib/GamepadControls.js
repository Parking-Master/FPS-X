GamepadControls = {
  isConnected: false,
  speed: 1,
  buttonDownEvent: () => {},
  buttonUpvent: () => {}
};

let keyCodeMaps = {
  "forward": "KeyW",
  "backward": "KeyS",
  "left": "KeyA",
  "right": "KeyD"
};

let moveRepeats = {};

function getAllIndexes(arr, val) {
  let indexes = [];
  let i = -1;

  while ((i = arr.indexOf(val, i+1)) != -1) {
    indexes.push(i);
  }

  return indexes;
}

function move(direction, secondDirection = null) {
  let formattedDirection = `${direction}${secondDirection ? "_" + secondDirection : ""}`;
  if (typeof moveRepeats[formattedDirection] === "undefined") moveRepeats[formattedDirection] = false;
  if (moveRepeats[formattedDirection]) return;
  moveRepeats[formattedDirection] = true;

  keyPress(keyCodeMaps[direction]);
  if (secondDirection) keyPress(keyCodeMaps[secondDirection]);
  stopAllExcept(direction, secondDirection);
  console.log("Move event called.");
}
function stop(direction = null) {
  if (!direction) {
    console.log("Move event stopped.");
    for (i in moveRepeats) {
      moveRepeats[i] = false;
    }
    return Object.values(keyCodeMaps).forEach(key => {
      keyStop(key);
    });
  }
  keyStop(keyCodeMaps[direction]);
}
function stopAllExcept(direction, secondDirection = null) {
  let formattedDirection = `${direction}${secondDirection ? "_" + secondDirection : ""}`;
  for (i in moveRepeats) {
    if (i !== formattedDirection) moveRepeats[i] = false;
  }
  for (key in keyCodeMaps) {
    let value = keyCodeMaps[key];
    if (key !== direction && key !== secondDirection) keyStop(value);
  }
}
function keyPress(code) {
  keyStates[code] = true;
  document.dispatchEvent(new Event("keydown", { code: code }));
}
function keyStop(code) {
  keyStates[code] = false;
  keyRepeats[code] = false;
  document.dispatchEvent(new Event("keyup", { code: code }));
}

let lookSensitivity = 0.6;
let lookAcceleration = 0.005;

let temporaryLookSensitivity = 0;
let gamepad;
let initialLookSpeed = 0.02;
let lookSpeed = initialLookSpeed;
let diagonalThreshold = 0.5;
let previousButtonStates = {};

window.addEventListener('gamepadconnected', (e) => {
  console.log("Gamepad connected:", e.gamepad.id);
  GamepadControls.isConnected = true;
  gamepad = e.gamepad;
  initButtonStates();
});

window.addEventListener('gamepaddisconnected', (e) => {
  console.log("Gamepad disconnected");
  GamepadControls.isConnected = false;
  gamepad = null;
  previousButtonStates = {};
});

function initButtonStates() {
  for (let i = 0; i < gamepad.buttons.length; i++) {
    previousButtonStates[i] = gamepad.buttons[i].pressed;
  }
}

let prevGamepads = navigator.getGamepads();
function poll() {
  requestAnimationFrame(poll);
  let gamepads = navigator.getGamepads();
  if (gamepads.length > prevGamepads) gamepad = navigator.getGamepads()[navigator.getGamepads().length - 1];
  prevGamepads = gamepads;

  if (gamepad) {
    handleLookMovement();
    handleDirectionalMovement();
    handleButtonEvents();
  }
}

function handleLookMovement() {
  const lookX = gamepad.axes[2];
  const lookY = gamepad.axes[3];

  temporaryLookSensitivity = Math.abs(lookX) * (lookSensitivity * GamepadControls.speed);
  
  let multiplier = 1;
  if (utils.options.get("AutoLockPosition")) multiplier = multiplier / ((camera.position.distanceTo(utils.options.get("AutoLockPosition")) / 3) + 1);
  if (utils.options.get("Walking")) multiplier *= 1.5;

  if (Math.abs(lookX) > 0.2) {
    camera.rotation.y -= lookX * lookSpeed * multiplier;
  }
  if (Math.abs(lookY) > 0.2) {
    camera.rotation.x -= lookY * lookSpeed * multiplier;
  }

  if (!(Math.abs(lookX) > 0.1) && !(Math.abs(lookY) > 0.1)) {
    lookSpeed = initialLookSpeed;
    looking = false;
    utils.options.set("CameraTurning", false);
  } else {
    if (lookSpeed < temporaryLookSensitivity / 10) lookSpeed += lookAcceleration;
    looking = true;
    utils.options.set("CameraTurning", true);
    gametime.run("rotate", [gametime.player.uuid, (camera.rotation.x + "," + camera.rotation.y + "," + camera.rotation.z + "," + camera.position.x + "," + camera.position.y + "," + camera.position.z)]);
  }

  camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
}

let stopped = false;
let looking = false;
function handleDirectionalMovement() {
  const moveX = gamepad.axes[0];
  const moveY = gamepad.axes[1];

  if (Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1) {
    stopped = false;
    // Aim assist
    utils.options.set("CameraTurning", true);
    if (utils.options.get("AutoLockPosition")) {
      const targetPosition = utils.options.get("AutoLockPosition");
      const targetQuaternion = new THREE.Quaternion();
      const m = new THREE.Matrix4().lookAt(camera.position, targetPosition, camera.up);
      targetQuaternion.setFromRotationMatrix(m);
      
      camera.quaternion.slerp(targetQuaternion, 0.05);
    } else {
      if (!looking) utils.options.set("CameraTurning", false);
    }
    if (moveX < -diagonalThreshold && Math.abs(moveY) < diagonalThreshold) {
      move("left");
    } else if (moveX < -diagonalThreshold && moveY < -diagonalThreshold) {
      move("forward", "left");
    } else if (Math.abs(moveX) < diagonalThreshold && moveY < -diagonalThreshold) {
      move("forward");
    } else if (moveX > diagonalThreshold && moveY < -diagonalThreshold) {
      move("forward", "right");
    } else if (moveX > diagonalThreshold && Math.abs(moveY) < diagonalThreshold) {
      move("right");
    } else if (moveX > diagonalThreshold && moveY > diagonalThreshold) {
      move("backward", "right");
    } else if (Math.abs(moveX) < diagonalThreshold && moveY > diagonalThreshold) {
      move("backward");
    } else if (moveX < -diagonalThreshold && moveY > diagonalThreshold) {
      move("backward", "left");
    }
  } else {
    if (stopped) return;
    stopped = true;
    stop();
  }
}

buttonRepeatExceptions = [5];

function handleButtonEvents() {
  for (let i = 0; i < gamepad.buttons.length; i++) {
    const buttonPressed = gamepad.buttons[i].value > 0.1;
    if (buttonPressed && (buttonRepeatExceptions.includes(i) ? true: !previousButtonStates[i])) {
      onButtonPressed(i);
    } else if (!buttonPressed && previousButtonStates[i]) {
      onButtonReleased(i);
    }
    previousButtonStates[i] = buttonPressed;
  }
}

function onButtonPressed(buttonIndex) {
  console.log(`Button ${buttonIndex} pressed`);
  switch(buttonIndex) {
    case 0: GamepadControls.buttonDownEvent("a"); break;  // A button
    case 1: GamepadControls.buttonDownEvent("b"); break;  // B button
    case 2: GamepadControls.buttonDownEvent("x"); break;  // X button
    case 3: GamepadControls.buttonDownEvent("y"); break;  // Y button
    case 4: GamepadControls.buttonDownEvent("lb"); break; // Left Bumper
    case 5: GamepadControls.buttonDownEvent("rb"); break; // Right Bumper
    case 6: GamepadControls.buttonDownEvent("lt"); break; // Left Trigger
    case 7: GamepadControls.buttonDownEvent("rt"); break; // Right Trigger
    case 8: GamepadControls.buttonDownEvent("back"); break; // Back/View button
    case 9: GamepadControls.buttonDownEvent("start"); break; // Start/Menu button
    case 10: GamepadControls.buttonDownEvent("l"); break; // Left Stick button
    case 11: GamepadControls.buttonDownEvent("r"); break; // Right Stick button
    case 12: GamepadControls.buttonDownEvent("up"); break; // D-pad Up
    case 13: GamepadControls.buttonDownEvent("down"); break; // D-pad Down
    case 14: GamepadControls.buttonDownEvent("left"); break; // D-pad Left
    case 15: GamepadControls.buttonDownEvent("right"); break; // D-pad Right
  }
}

function onButtonReleased(buttonIndex) {
  console.log(`Button ${buttonIndex} released`);
  switch(buttonIndex) {
    case 0: GamepadControls.buttonUpEvent("a"); break;
    case 1: GamepadControls.buttonUpEvent("b"); break;
    case 2: GamepadControls.buttonUpEvent("x"); break;
    case 3: GamepadControls.buttonUpEvent("y"); break;
    case 4: GamepadControls.buttonUpEvent("lb"); break;
    case 5: GamepadControls.buttonUpEvent("rb"); break;
    case 6: GamepadControls.buttonUpEvent("lt"); break;
    case 7: GamepadControls.buttonUpEvent("rt"); break;
    case 8: GamepadControls.buttonUpEvent("back"); break;
    case 9: GamepadControls.buttonUpEvent("start"); break;
    case 10: GamepadControls.buttonUpEvent("l"); break;
    case 11: GamepadControls.buttonUpEvent("r"); break;
    case 12: GamepadControls.buttonUpEvent("up"); break;
    case 13: GamepadControls.buttonUpEvent("down"); break;
    case 14: GamepadControls.buttonUpEvent("left"); break;
    case 15: GamepadControls.buttonUpEvent("right"); break;
  }
}

buttonRepeats = {
  rb: false,
  rs: false,
  y: false,
  lt: false,
};
buttonData = {
  rb: {
    pressTimestamp: null,
    activated: false
  },
  x: {
    running: false
  }
};

buttonBindings = {
  jump: function() {
    keyPress("Space");
  },
  stop_jump: function() {
    keyStop("Space");
  },
  melee: function() {
    if (!buttonRepeats["b"]) {
      keyPress("KeyB");
      setTimeout(() => keyStop("KeyB"), 10);
      buttonRepeats["b"] = true;
    }
  },
  stop_melee: function() {
    buttonRepeats["b"] = false;
  },
  sprint: function(stop = false) {
    if (buttonRepeats["x"]) return;
    if (!stop) buttonRepeats["x"] = true;

    if (buttonData["x"].running || stop) {
      keyStop("ShiftLeft");
      buttonData["x"].running = false;
    } else {
      keyPress("ShiftLeft");
      buttonData["x"].running = true;
    }
  },
  stop_sprint: function() {
    buttonRepeats["x"] = false;
  },
  switchweapon: function() {
    if (!buttonRepeats["y"]) {
      keyPress("KeyY");
      setTimeout(() => keyStop("KeyY"), 10);
      buttonRepeats["y"] = true;
    }
  },
  stop_switchweapon: function() {
    buttonRepeats["y"] = false;
  },
  reload: function() {
    if (!buttonRepeats["rb"]) {
      buttonRepeats["rb"] = true;
  
      keyPress("KeyR");
      setTimeout(() => keyStop("KeyR"), 10);
    }
  },
  stop_reload: function() {
    buttonRepeats["rb"] = false;
    buttonData["rb"].pressTimestamp = null;
    buttonData["rb"].activated = false;
  },
  interact: function() {
    if (buttonData["rb"].activated) return;
    
    if (buttonData["rb"].pressTimestamp === null) {
      buttonData["rb"].pressTimestamp = Date.now();
    } else {
      if (Date.now() - buttonData["rb"].pressTimestamp >= 200) {
        buttonData["rb"].activated = true;
    
        keyPress("KeyE");
        setTimeout(() => keyStop("KeyE"), 200);
      }
    }
  },
  stop_interact: function() {
    buttonRepeats["rb"] = false;
    buttonData["rb"].pressTimestamp = null;
    buttonData["rb"].activated = false;
  },
  throwgrenade: function() {
    if (!buttonRepeats["lt"]) {
      keyPress("KeyG");
      setTimeout(() => keyStop("KeyG"), 10);
      buttonRepeats["lt"] = true;
    }
  },
  stop_throwgrenade: function() {
    buttonRepeats["lt"] = false;
  },
  shoot: function() {
    keyPress("KeyF");
  },
  stop_shoot: function() {
    keyStop("KeyF");
  },
  zoom: function() {
    if (!buttonRepeats["rs"]) {
      keyPress("KeyI");
      setTimeout(() => keyStop("KeyI"), 10);
      buttonRepeats["rs"] = true;
    }
  },
  stop_zoom: function() {
    buttonRepeats["rs"] = false;
  }
};

poll();

GamepadControls.onsprintend = function() {
  if (GamepadControls.isConnected) buttonBindings.sprint(true);
};

GamepadControls.buttonDownEvent = function(key) {
  let allBindings = getAllIndexes(Object.values(user.preferences.game.gamepadBindings), key);
  for (let i = 0; i < allBindings.length; i++) {
    let binding = Object.keys(user.preferences.game.gamepadBindings)[allBindings[i]];
    buttonBindings[binding]();
  }
};

GamepadControls.buttonUpEvent = function(key) {
  let allBindings = getAllIndexes(Object.values(user.preferences.game.gamepadBindings), key);
  for (let i = 0; i < allBindings.length; i++) {
    let binding = Object.keys(user.preferences.game.gamepadBindings)[allBindings[i]];
    buttonBindings["stop_" + binding]();
  }
};