const cssStyle = `
:root {
  --border-width:12px;
  --border-radius:12px;
  --border-color:black;
  --line-width: 4px;
  --half-line-width: calc(var(--line-width)/2);
  --quart-line-width: calc(var(--line-width)/4);
  --handler-height: 60px;
  --handler-width: calc(var(--line-width) * 2);
  --half-handler-width: calc(var(--handler-width)/2);
  --hover-factor:1.8;
}
.images {
  display: flex;
  width: 100%;
  height: 100%;
  grid-column: 1;
  grid-row: 1;
  z-index: 1;
  justify-content: space-between;
  align-items: stretch;
  position: relative;
}
.images .right, .images .left {
  position: absolute;
  height: 100%;
}
.images .right {
  flex-grow: 1;
}
.wrapper {
  display: grid;
  grid-template: 1fr / 1fr;
  place-items: center;

  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  margin: auto;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  justify-content: space-between;
  align-items: stretch;
  overflow: hidden;
}
.controls {
  grid-column: 1;
  box-sizing: border-box;
  grid-row: 1;
  height: 100%;
  width: 100%;
  background: transparent;
  display: flex;
  z-index: 10;
}
.left {
  box-sizing: border-box;
  border-radius: var(--border-radius) 0 0 var(--border-radius);
  width: calc(50% - var(--half-line-width));
  background-position: left;
}
.right {
  background-position: right;
  right: 0;
}
.left, .right {
  will-change: width;
}
.left .img, .right .img{
  background-size: cover;
  width: 100%;
  position: relative;
  height:100%;
  user-select: none;
}
.right .img {
  right: 0;
  background-position: right;
  z-index: 1;
}
.clicked * {
  transition: width 75ms ease-in-out;
}
.line {
  background: var(--border-color);
  width: var(--line-width);
  position:relative;
}
.grabber {
  width: var(--handler-width);
  height: var(--handler-height);
  background: var(--border-color);
}
.divide {
  position: relativ;
  width: 50px;
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  transform: translate(calc(-50% + var(--half-line-width)));
  cursor: col-resize;
}
.arrow-left, .arrow-right {
  border-style: solid;
  width: 0;
  height: 0;
  transition: transform .2s ease;
  will-change: transform;
  z-index:  99;
}
.arrow-left {
  transform: translateX(calc(var(--line-width)* -1));
  border-width: 8px 8px 8px 0;
  border-color: transparent var(--border-color) transparent transparent;
}
.divide:hover .arrow-left {
  transform: translateX(calc(var(--line-width) * calc(var(--hover-factor) * -1)));
}
.arrow-right {
  transform: translateX(var(--line-width));
  border-width: 8px 0 8px 8px;
  border-color: transparent transparent transparent var(--border-color);
}
.divide:hover .arrow-right {
  transform: translateX(calc(var(--line-width) * var(--hover-factor)));
}
`
const pos = (p) => `${p}px`
const minMaxVal = (min, max, val) => Math.max(min, Math.min(max, val))
const getOffsetOf = (juxSlider) => {
  let x = 0
  do {
    x += juxSlider.offsetLeft;
  } while (juxSlider = juxSlider.offsetParent);
  return x;
}

function offsetOfMouseOn({ pageX, clientX }, { fullWidth, borderWidth, $wrapper, $images }) {
  let offset = getOffsetOf($wrapper)
  let compOffset = getOffsetOf($images)

  let x = clientX || pageX
  let posX = minMaxVal(0, fullWidth, x - borderWidth - offset);

  return Math.round(posX)
}

function updateHandlePositionOf(juxSlider) {
  let requested = false
  return (mouse) => {
    if (!mouse.buttons) {
      this.removeEventListener('mousemove', juxSlider.updateHandler)
    } else {
      if (requested) cancelAnimationFrame(requested);
      requested = requestAnimationFrame(() => {
        let width = offsetOfMouseOn(mouse, juxSlider)
        juxSlider.setSliderTo(Math.round(width / juxSlider.fullWidth * 100))
      })
    }
  }
}

function setWidthOf(elem, newWidth) {
  elem.style.width = pos(newWidth)
}

class JuxSlider extends HTMLElement {
  constructor() {
    super();
    this.updateHandler = updateHandlePositionOf(this)
    this.positionInPercent = 50

  }
  updateImageWidth() {
    let newWidth = this.$images.offsetWidth;
    this.fullWidth = newWidth;
    this.$leftImg.style.backgroundSize = pos(newWidth)
    this.$rightImg.style.backgroundSize = pos(newWidth)
    this.setSliderTo(this.positionInPercent)
  }
  updateImageSrc() {
    this.$leftImg.style.backgroundImage = `url(${this.getAttribute('left-src')})`;
    this.$rightImg.style.backgroundImage = `url(${this.getAttribute('right-src')})`;
  }
  setSliderTo(percent) {
    this.positionInPercent = percent
    let position = this.percentToPos(percent)
    setWidthOf(this.$left, position)
    setWidthOf(this.$division, position)
    setWidthOf(this.$right, (this.fullWidth - position))
  }
  posToPercent(pos) {
    return pos ? pos / juxSlider.fullWidth * 100 : 0
  }
  percentToPos(percent) {
    return this.fullWidth / 100 * percent
  }
  connectedCallback() {
    this.innerHTML = this.render();

    this.borderWidth = parseInt(this.getAttribute('border-width') || getComputedStyle(this).getPropertyValue(
      "--border-width")) || 4;
    this.borderColor = this.getAttribute('border-color') || getComputedStyle(this).getPropertyValue(
      "--border-color")
    this.style.setProperty('--border-width', pos(this.borderWidth));
    this.style.setProperty('--border-color', this.borderColor);

    this.$left = this.querySelector('.images .left');
    this.$right = this.querySelector('.images .right');
    this.$division = this.querySelector('.controls .left');
    this.$rightArea = this.querySelector('.right .img');
    this.$wrapper = this.querySelector('.wrapper');
    this.$leftImg = this.querySelector(".left .img");
    this.$rightImg = this.querySelector(".right .img");
    this.$images = this.querySelector('.images');


    this.updateImageSrc();
    this.updateImageWidth();

    this.addEventListener('mousedown', (mouse) => {
      this.$wrapper.classList.add('clicked')
      this.updateHandler(mouse)
      setTimeout(() => {
        this.$wrapper.classList.remove('clicked')
        this.addEventListener('mousemove', this.updateHandler)
      }, 75)
    })

    this.addEventListener('mouseup', () => {
      this.removeEventListener('mousemove', this.updateHandler)
    })

    this.observer = new ResizeObserver(() => this.updateImageWidth())
    this.observer.observe(this.$wrapper)
  }
  disconnectedCallback() {
    this.observer.disconnect()
  }

  render() {
    return `<style>${cssStyle}</style>
  <div class="wrapper">
    <div class="images">
      <div class="left"><div class="img"></div></div>
      <div class="right"><div class="img"></div></div>
    </div>
    <div class="controls">
      <div class="left"></div>
      <div class="line">
        <div class="divide">
          <div class="arrow-left"></div>
          <div class="grabber"></div>
          <div class="arrow-right"></div>
        </div>
      </div>
      <div class="right"></div>
    </div>
  </div>`
  }
}
customElements.define('jux-slider', JuxSlider);
