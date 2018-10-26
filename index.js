// DIV Baller Shooter Thingy
// By Daniel Kurashige-Gollub on 2018-10-25
//
// Two divs, one static in place, the other moving from left to 
// right. Inside each div is a canvas. I click anywhere in the canvas,
// it creates a circle. I click outside the circle, it fires bullets. 
// I click on the circle again, the circle is removed.
//
// Copyright (c) 2018 by Daniel Kurashige-Gollub <daniel@kurashige-gollub.de>
// 
// LICENSE
// MIT 2.0, https://opensource.org/licenses/MIT
// 

import './style.css';

////// Globals
const WIDTH = 500;
const HEIGHT = 300;
const PI2 = 2 * Math.PI;
const CIRCLE_COLOR = 'rgba(90, 150, 77, 0.8)';
const BULLET_COLOR = 'rgba(230, 14, 58, 0.8)';

const appDiv = document.getElementById('app');
const circles = [];

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Circle extends Point {
  constructor(parent, x, y, r) {
    super(x, y);

    this.parent = parent;

    this.r = r;
    this.alive = false;
    this.bullets = [];
  }

  hit(x, y) {
    const a = Math.pow(Math.abs(x - this.x), 2);
    const b = Math.pow(Math.abs(y - this.y), 2);
    const sqrt = Math.sqrt(a + b)

    return sqrt < this.r;
  }

  getAngle(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;

    return Math.atan2(dy, dx);
  }

  mdk() {
    this.bullets = [];
    this.alive = false;
  }

  respawn(x, y) {
    this.x = x;
    this.y = y;
    this.bullets = [];
    this.alive = true;
  }

  fire(x, y) {
    // I suck at math: https://math.stackexchange.com/a/2109383
    const r = this.r + 7;
    const d = Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2));

    const bx = (this.x - (r * (this.x - x)) / d);
    const by = (this.y - (r * (this.y - y)) / d);

    const alpha = this.getAngle(x, y);
    
    this.bullets.push(new Bullet(this, bx, by, alpha));
  }

  update(time) {
    if (!this.alive) return;

    const alive = []
    this.bullets.forEach(bullet => {
      bullet.update(time);
      if (!bullet.dead) {
        alive.push(bullet);
      }
    });

    this.bullets = alive;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, PI2);
    ctx.fillStyle = this.color || CIRCLE_COLOR;
    ctx.fill();

    this.bullets.forEach(bullet => {
      bullet.draw(ctx);
    });
  }
}

class Bullet extends Point {
  constructor(origin, x, y, alpha) {
    super(x, y);

    this.r = 5;
    this.origin = origin;
    this.alpha = alpha;
    this.dead = false;
  }

  update(time) {
    // move a bit

    // Again. I fail at basic math:  https://stackoverflow.com/a/1571352
    this.x = this.x + (this.r * Math.cos(this.alpha));
    this.y = this.y + (this.r * Math.sin(this.alpha));

    const s = this.r - 1;

    if (this.x < -s || this.x > WIDTH + s) {
      this.dead = true;
    } else if (this.y < -s || this.y > HEIGHT + s) {
      this.dead = true;
    }
  }

  draw(ctx) {
    if (this.dead) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, PI2);
    ctx.fillStyle = this.color || BULLET_COLOR;
    ctx.fill();
  }
}

////// Helper functions

function createDiv() {
  const div = document.createElement('div');
  div.classList.add('field');
  return div;
}

function createCanvas(parentDiv) {
  const canvas = document.createElement('canvas');

  canvas.addEventListener('click', onCanvasClick);

  parentDiv.appendChild(canvas);

  return canvas;
}

function createContext(extraClass = undefined) {
  const div = createDiv();
  const canvas = createCanvas(div);
  const ctx = canvas.getContext('2d');

  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  if (extraClass) {
    div.classList.add(extraClass)
  }

  appDiv.appendChild(div);

  const circle = new Circle(canvas, WIDTH / 2, HEIGHT / 2, 20);
  circles.push(circle);

  return ctx;
}

function drawStart(contexts) {
  function draw(time) {
    contexts.forEach((ctx, idx) => {
      const { width, height } = ctx.canvas;
      
      ctx.clearRect(0, 0, width, height);

      const circle = circles[idx];
      if (circle.alive) {
        circle.draw(ctx);
      }

      circle.update(time);
    });

    requestAnimationFrame(draw);
  }

  draw();
}

function getMousePosition(canvas, event) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: Math.round(event.clientX - rect.left),
    y: Math.round(event.clientY - rect.top)
  };
}

////// User Interaction

function onCanvasClick(event) {
  const circle = circles.find(c => c.parent === event.target);
  if (!circle) {
    console.warn('Circle not found for canvas', event.target);
    return;
  }

  // check where circle is at and if we hit it
  const { x, y } = getMousePosition(circle.parent, event);
  const { clientWidth, clientHeight, width, height } = circle.parent;

  // convert to canvas pixel resolution, since that is different from the css one
  const cx = (x / clientWidth) * width;
  const cy = (y / clientHeight) * height;

  if (!circle.alive) {
    circle.respawn(cx, cy);
    return;
  }

  if (circle.hit(cx, cy) && circle.alive) {
    circle.mdk();
    return;
  }

  if (circle.alive) {
    circle.fire(cx, cy);
  }
}

////// Main Entry Point

const contexts = [
  createContext(),
  createContext('animate'),
]

drawStart(contexts);
