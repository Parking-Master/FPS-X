class CustomSlider {
  constructor(element, options = {}) {
    this.element = element;
    this.thumb = element.querySelector('.slider-thumb');
    this.track = element.querySelector('.slider-track');
    this.min = options.min || 0;
    this.max = options.max || 100;
    this.value = options.value || this.min;
    this.onchange = options.onchange || (() => {});
    this.onfinish = options.onfinish || (() => {});

    this.initEvents();
    this.updateThumbPosition();
  }

  initEvents() {
    this.thumb.addEventListener('mousedown', this.startDragging.bind(this));
    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.stopDragging.bind(this));
  }

  startDragging(e) {
    this.isDragging = true;
    this.startX = e.clientX - this.thumb.offsetLeft;
  }

  stopDragging() {
    if (this.isDragging) this.onfinish(this.value);
    this.isDragging = false;
  }

  drag(e) {
    if (!this.isDragging) return;
    
    let newX = e.clientX - this.startX;
    let maxX = this.track.offsetWidth - this.thumb.offsetWidth;
    
    newX = Math.max(0, Math.min(newX, maxX));
    
    let percentage = newX / maxX;
    this.value = this.min + percentage * (this.max - this.min);
    
    this.updateThumbPosition();
    this.onchange(this.value);
  }

  updateThumbPosition() {
    let percentage = (this.value - this.min) / (this.max - this.min);
    let newX = percentage * (this.track.offsetWidth - this.thumb.offsetWidth);
    this.thumb.style.left = `${newX}px`;
  }

  setValue(newValue) {
    this.value = Math.max(this.min, Math.min(newValue, this.max));
    this.updateThumbPosition();
    this.onchange(this.value);
  }

  getValue() {
    return this.value;
  }
}