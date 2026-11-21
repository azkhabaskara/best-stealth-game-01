// input.js — keyboard state and mouse clicks for the canvas.
//
// Keys are tracked by code so WASD and the arrow keys share one move
// vector. consumePressed lets the game react once per key press (pause,
// mute, restart, Enter). Clicks are queued with canvas coordinates so
// the game can hit-test its own buttons.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set();
    this.pressed = new Set();
    this.clicks = [];
    this.mouse = { x: 0, y: 0, inside: false };
    this.hover = { x: -1, y: -1 };

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (!e.repeat) this.pressed.add(e.code);
      this.down.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => {
      this.down.clear();
      this.pressed.clear();
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.hover.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      this.hover.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      this.mouse.x = this.hover.x;
      this.mouse.y = this.hover.y;
      this.mouse.inside = true;
    });
    canvas.addEventListener('mouseleave', () => { this.mouse.inside = false; });
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.clicks.push({
        x: ((e.clientX - rect.left) / rect.width) * canvas.width,
        y: ((e.clientY - rect.top) / rect.height) * canvas.height,
      });
    });
  }

  isDown(code) {
    return this.down.has(code);
  }

  consumePressed(code) {
    if (this.pressed.has(code)) {
      this.pressed.delete(code);
      return true;
    }
    return false;
  }

  // 8-way movement vector from WASD / arrows, normalised.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.down.has('KeyA') || this.down.has('ArrowLeft')) x -= 1;
    if (this.down.has('KeyD') || this.down.has('ArrowRight')) x += 1;
    if (this.down.has('KeyW') || this.down.has('ArrowUp')) y -= 1;
    if (this.down.has('KeyS') || this.down.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y };
  }

  get sneaking() {
    return this.down.has('ShiftLeft') || this.down.has('ShiftRight');
  }

  // Take and clear the click queue for this frame.
  takeClicks() {
    const out = this.clicks;
    this.clicks = [];
    return out;
  }

  endFrame() {
    this.pressed.clear();
  }
}
