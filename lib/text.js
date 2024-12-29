(function() {
  const textPool = [];
  
  function createTextTexture(text, fontSize = 16, fontFamily = "Arial", color = "white", backgroundColor = "rgba(0,0,0,0)") {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
  
    context.font = `${fontSize}px ${fontFamily}`;
  
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;
  
    const padding = 4;
    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;
  
    context.font = `${fontSize}px ${fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = "black";
    context.shadowBlur = 2;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
  
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  
    context.fillStyle = color;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
  
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
  
    return texture;
  }
  
  function createText() {
    let texture = createTextTexture.apply(null, arguments);
    let material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: true });
    let geometry = new THREE.PlaneGeometry(1, 1);
    let text = new THREE.Mesh(geometry, material);
  
    let aspectRatio = texture.image.width / texture.image.height;
    text.scale.set(aspectRatio, 1, 1);
  
    textPool.push(text);
  
    return text;
  }

  function createPointerText() {
    let pointer = new THREE.Group();
    let text = createText.apply(null, arguments);
    textPool.splice(textPool.indexOf(text), 1);
    text.translateX((text.scale.x / 2) + 0.1);
    pointer.add(text);

    let arrowTexture = new THREE.TextureLoader().load("/images/other/arrow.png");
    let arrowMaterial = new THREE.MeshBasicMaterial({
      map: arrowTexture,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      depthTest: false,
      depthWrite: true
    });
    let arrowGeometry = new THREE.PlaneGeometry(1, 1);
    let arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.scale.set(1.5, 1.5, 1.5);
    pointer.add(arrow);

    pointer.name = "PointerText";
    pointer.userData.pointerUUID = gametime.uuidv4();

    textPool.push(pointer);

    return pointer;
  }

  function removePointerText(uuid) {
    let pointer = textPool.filter(text => text.userData.pointerUUID === uuid)[0];

    if (!pointer) return;
    textPool.splice(textPool.indexOf(pointer), 1);
    pointer.traverse(object => {
      if (object.material) object.material.dispose();
      if (object.geometry) object.geometry.dispose();
      if (object.dispose) object.dispose();
    });
    scene.remove(pointer);

    pointer = null;
  }
  
  function update() {
    for (let i = 0; i < textPool.length; i++) {
      textPool[i].lookAt(camera.position);
      if (textPool[i].name === "PointerText") {
        let distance = camera.position.distanceTo(textPool[i].position) / 40;
        let opacity = Math.max((40 - camera.position.distanceTo(textPool[i].position)) / 40, 0) + 0.3;

        textPool[i].scale.set(distance, distance, distance);
        textPool[i].traverse(object => {
          if (object.material) object.material.opacity = opacity;
        });
      }
    }
  }
  
  THREE.Text = {
    createTextTexture: createTextTexture,
    createText: createText,
    createPointerText: createPointerText,
    removePointerText: removePointerText,
    update: update
  };
})();