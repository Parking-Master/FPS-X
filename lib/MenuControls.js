GamepadControls = {
  isConnected: false,
  cursor: document.querySelector(".gamepad-cursor"),
  cursorX: 0,
  cursorY: 0,
  hoveringElement: null,
  buttonEvent: () => {}
};

function triggerAllHoverEvents(element) {
  const hoverEvents = ["mouseover", "mouseenter", "mousemove"];
  
  hoverEvents.forEach(eventType => {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: GamepadControls.cursorX,
      clientY: GamepadControls.cursorY
    });
    element.dispatchEvent(event);
  });
}

function cancelAllHoverEvents(element) {
  const unhoverEvents = ["mouseout", "mouseleave"];

  unhoverEvents.forEach(eventType => {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(event);
  });
}

function triggerAllClickEvents(element) {
  const events = ["click", "mousedown"];
  
  events.forEach(eventType => {
    const event = new MouseEvent(eventType, {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: GamepadControls.cursorX,
      clientY: GamepadControls.cursorY
    });
    element.dispatchEvent(event);
  });
}

function cancelAllClickEvents(element) {
  const events = ["mouseup"];
  
  events.forEach(eventType => {
    const event = new MouseEvent(eventType, {
      view: window,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
  });
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

let pointerSpeed = 3;
let scrollSpeed = 5;
let gamepad;
let previousButtonStates = {};

window.addEventListener('gamepadconnected', (e) => {
  console.log("Gamepad connected:", e.gamepad.id);
  GamepadControls.isConnected = true;
  gamepad = e.gamepad;
  initButtonStates();

  let oldMenuDialog = menuDialog;
  menuDialog = function() {
    let output = oldMenuDialog.apply(null, arguments);
    if (document.querySelector(".swal-button") && /Cancel|Close/g.test(document.querySelector(".swal-button").textContent)) {
      document.querySelector(".swal-button").textContent += " [B]";
    }
    return output;
  };

  document.querySelectorAll("*").forEach(element => element.style.cursor = "none");
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

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let acceleration = 0;

function handleLookMovement() {
  const scrollX = gamepad.axes[2];
  const scrollY = gamepad.axes[3];

  if (Math.abs(scrollX) < 0.1 && Math.abs(scrollY) < 0.1) {
    return;
  }

  if (document.querySelector(".swal-content") && document.querySelector(".swal-content").contains(GamepadControls.hoveringElement)) {
    document.querySelector(".swal-content").scrollTop += scrollY * scrollSpeed;
  }
}

function handleDirectionalMovement() {
  const axisX = gamepad.axes[0];
  const axisY = gamepad.axes[1];

  if (Math.abs(axisY) < 0.1 && Math.abs(axisX) < 0.1) {
    acceleration = 0;
    return;
  }

  acceleration += 0.05;
  if (acceleration > 1) acceleration = 1;

  cursorX += axisX * pointerSpeed * global.wrapperScale * acceleration * 10;
  cursorY += axisY * pointerSpeed * global.wrapperScale * acceleration * 10;

  cursorX = Math.max(0, Math.min(window.innerWidth, cursorX));
  cursorY = Math.max(0, Math.min(window.innerHeight, cursorY));

  GamepadControls.cursorX = cursorX;
  GamepadControls.cursorY = cursorY;

  GamepadControls.cursor.style.visibility = "visible";
  GamepadControls.cursor.style.left = `${cursorX}px`;
  GamepadControls.cursor.style.top = `${cursorY}px`;
  
  // Mimic real cursor events
  let hoveringElement = document.elementsFromPoint(cursorX, cursorY).filter(element => element !== GamepadControls.cursor)[0];
  document.querySelectorAll("*").forEach(hoveringElement => {
    hoveringElement.classList.remove("hover");
    cancelAllHoverEvents(hoveringElement);
  });
  hoveringElement.classList.add("hover");
  triggerAllHoverEvents(hoveringElement);

  GamepadControls.hoveringElement = hoveringElement;

  // if (buttonRepeats["a"]) document.dispatchEvent(new MouseEvent("mousemove", { view: window, bubbles: true, cancelable: true, clientX: cursorX, clientY: cursorY }));
}

function handleButtonEvents() {
  for (let i = 0; i < gamepad.buttons.length; i++) {
    const buttonPressed = gamepad.buttons[i].value > 0.1;
    if (buttonPressed && !previousButtonStates[i]) {
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
    case 0: aButtonPressed(); break;  // A button
    case 1: bButtonPressed(); break;  // B button
    case 2: xButtonPressed(); break;  // X button
    case 3: yButtonPressed(); break;  // Y button
    case 4: lbButtonPressed(); break; // Left Bumper
    case 5: rbButtonPressed(); break; // Right Bumper
    case 6: ltButtonPressed(); break; // Left Trigger
    case 7: rtButtonPressed(); break; // Right Trigger
    case 8: backButtonPressed(); break; // Back/View button
    case 9: startButtonPressed(); break; // Start/Menu button
    case 10: lsButtonPressed(); break; // Left Stick button
    case 11: rsButtonPressed(); break; // Right Stick button
    case 12: dpadUpPressed(); break; // D-pad Up
    case 13: dpadDownPressed(); break; // D-pad Down
    case 14: dpadLeftPressed(); break; // D-pad Left
    case 15: dpadRightPressed(); break; // D-pad Right
  }
}

function onButtonReleased(buttonIndex) {
  console.log(`Button ${buttonIndex} released`);
  switch(buttonIndex) {
    case 0: (aButtonReleased(), GamepadControls.buttonEvent("a")); break;
    case 1: (bButtonReleased(), GamepadControls.buttonEvent("b")); break;
    case 2: (xButtonReleased(), GamepadControls.buttonEvent("x")); break;
    case 3: (yButtonReleased(), GamepadControls.buttonEvent("y")); break;
    case 4: (lbButtonReleased(), GamepadControls.buttonEvent("lb")); break;
    case 5: (rbButtonReleased(), GamepadControls.buttonEvent("rb")); break;
    case 6: (ltButtonReleased(), GamepadControls.buttonEvent("lt")); break;
    case 7: (rtButtonReleased(), GamepadControls.buttonEvent("rt")); break;
    case 8: (backButtonReleased(), GamepadControls.buttonEvent("back")); break;
    case 9: (startButtonReleased(), GamepadControls.buttonEvent("start")); break;
    case 10: (lsButtonReleased(), GamepadControls.buttonEvent("l")); break;
    case 11: (rsButtonReleased(), GamepadControls.buttonEvent("r")); break;
    case 12: (dpadUpReleased(), GamepadControls.buttonEvent("up")); break;
    case 13: (dpadDownReleased(), GamepadControls.buttonEvent("down")); break;
    case 14: (dpadLeftReleased(), GamepadControls.buttonEvent("left")); break;
    case 15: (dpadRightReleased(), GamepadControls.buttonEvent("right")); break;
  }
}

buttonRepeats = {
  a: false
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

// Jump
function aButtonPressed() {
  if (!buttonRepeats["a"]) {
    if (GamepadControls.hoveringElement) {
      triggerAllClickEvents(GamepadControls.hoveringElement);
      buttonRepeats["a"] = true;
    }
  }
}
function aButtonReleased() {
  cancelAllClickEvents(GamepadControls.hoveringElement);
  buttonRepeats["a"] = false;
}

// Melee
function bButtonPressed() {
  if (!buttonRepeats["b"]) {
    if (document.querySelector(".swal-button") && /Cancel|Close/g.test(document.querySelector(".swal-button").textContent)) {
      triggerAllClickEvents(document.querySelector(".swal-button"));
      buttonRepeats["b"] = true;
    }
  }
}
function bButtonReleased() {
  buttonRepeats["b"] = false;
}

// Sprint
function xButtonPressed() {}
function xButtonReleased() {}

// Switch weapon
function yButtonPressed() {}
function yButtonReleased() {}

function lbButtonPressed() {}
function lbButtonReleased() {}

// Reload/Interact
function rbButtonPressed() {}
function rbButtonReleased() {}

// Throw Grenade
function ltButtonPressed() {}
function ltButtonReleased() {}

// Shoot
function rtButtonPressed() {}
function rtButtonReleased() {}

function backButtonPressed() {}
function backButtonReleased() {}

// Pause
function startButtonPressed() { console.log("Start/Menu button pressed - Pause game"); }
function startButtonReleased() { console.log("Start/Menu button released - Resume game"); }

// Crouch
function lsButtonPressed() { console.log("Left Stick button pressed - Sprint"); }
function lsButtonReleased() { console.log("Left Stick button released - Stop sprinting"); }

// Zoom
function rsButtonPressed() {}
function rsButtonReleased() {}

function dpadUpPressed() {}
function dpadUpReleased() {}
function dpadDownPressed() {}
function dpadDownReleased() {}
function dpadLeftPressed() {}
function dpadLeftReleased() {}
function dpadRightPressed() {}
function dpadRightReleased() {}

poll();