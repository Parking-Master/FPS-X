let audioContext = new AudioContext();
let preloadedAudios = {};
let audioSources = {};
let audioSources3d = {};
let audioIds = {};

function disposeAudio(audio) {
  if (audio) {
    audio.pause();
    audio.remove();
    audio = null;
  }
}

THREE.Sound = function Sound(source = null, preserve3d = true, object = new THREE.Object3D, callback = function(sound) {}, volume = 5, distance = 10, loop = false, checkPlaying = false, audioId = null) {
  if (!preserve3d) {
    if (source.startsWith("preloaded:")) {
      if (checkPlaying && audioId && audioIds[audioId] && audioIds[audioId].playing) return;

      let audioBuffer = preloadedAudios[source];
      const audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffer;
      audioSource.connect(audioContext.destination);
    
      const startTime = audioContext.currentTime + 0.1; // Start in 100ms
      audioSources[source] = audioSource;
      audioSource.start(startTime);
      audioSource.loop = loop;
      if (audioId) audioIds[audioId] = {
        playing: true
      };
    
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
      sound.loop = loop;
      sound.play();
      sound.addEventListener("ended", function() {
        disposeAudio(sound);
      });
    }
    return;
  }
  if (source.startsWith("preloaded:")) {
    if (typeof camera.getObjectByProperty("type", "AudioListener") == "undefined") camera.add(new THREE.AudioListener());
    let sound = new THREE.PositionalAudio(camera.getObjectByProperty("type", "AudioListener"));
    let buffer = audioSources3d[source];
    sound.setBuffer(buffer);
    sound.setMaxDistance(distance);
    sound.setRefDistance(1);
    sound.setVolume(volume);
    callback(sound);
    sound.play();
    object.add(sound);
  } else {
    if (typeof camera.getObjectByProperty("type", "AudioListener") == "undefined") camera.add(new THREE.AudioListener());
    let sound = new THREE.PositionalAudio(camera.getObjectByProperty("type", "AudioListener"));
    new THREE.AudioLoader().load(source, (buffer) => {
      sound.setBuffer(buffer);
      sound.setMaxDistance(distance);
      sound.setRefDistance(1);
      sound.setVolume(volume);
      callback(sound);
      sound.play();
    });
    object.add(sound);
  }
};
THREE.Sound.preload = function(name, source) {
  fetch(source).then(response => response.arrayBuffer()).then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer)).then(buffer => {
    preloadedAudios[`preloaded:${name}`] = buffer;
  });
};
THREE.Sound.preload3d = function(name, source) {
  new THREE.AudioLoader().load(source, (buffer) => {
    audioSources3d[`preloaded:${name}`] = buffer;
  });
};
THREE.Sound.stop = function Sound(source = null, audioId = null) {
  if (audioSources[source]) audioSources[source].stop();
  if (audioIds[audioId]) audioIds[audioId].playing = false;
};