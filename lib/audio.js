let audioContext = new AudioContext();
let preloadedAudios = {};

function disposeAudio(audio) {
  if (audio) {
    audio.pause();
    audio.remove();
    audio = null;
  }
}

THREE.Sound = function Sound(source = null, preserve3d = true, object = new THREE.Object3D, callback = function(sound) {}, volume = 5, loop) {
  if (!preserve3d) {
    if (source.startsWith("preloaded:")) {
      let audioBuffer = preloadedAudios[source];
      const audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffer;
      audioSource.connect(audioContext.destination);
    
      const startTime = audioContext.currentTime + 0.1; // Start in 100ms
      audioSource.start(startTime);
    
      const eventQueue = [];
    
      function scheduleEvent(time, callback) {
        eventQueue.push({ time, callback });
        eventQueue.sort((a, b) => a.time - b.time);
      }
    
      function processEventQueue() {
        const currentTime = audioContext.currentTime;
        while (eventQueue.length && eventQueue[0].time <= currentTime) {
          const event = eventQueue.shift();
          event.callback();
        }
        requestAnimationFrame(processEventQueue);
      }
    
      processEventQueue();
    
      scheduleEvent(startTime + 1, () => {});
    } else {
      let sound = new Audio();
      sound.src = source;
      if (loop) sound.loop = loop;
      sound.play();
      sound.addEventListener("ended", function() {
        disposeAudio(sound);
      });
    }
    return;
  }
  if (typeof camera.getObjectByProperty("type", "AudioListener") == "undefined") camera.add(new THREE.AudioListener());
  let sound = new THREE.PositionalAudio(camera.getObjectByProperty("type", "AudioListener"));
  new THREE.AudioLoader().load(source, (buffer) => {
    sound.setBuffer(buffer);
    sound.setRefDistance(5);
    sound.setVolume(volume);
    callback(sound);
    sound.play();
  });
  object.add(sound);
};
THREE.Sound.preload = function(name, source) {
  fetch(source).then(response => response.arrayBuffer()).then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer)).then(buffer => {
    preloadedAudios[`preloaded:${name}`] = buffer;
  });
};