const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const fpsEl = document.getElementById('fps-counter');
const charEl = document.getElementById('char-count');

const FONT_SIZE = 20;
const LINE_HEIGHT = 34;
const FONT = `${FONT_SIZE}px "Noto Sans JP", sans-serif`;
const BACKGROUND = '#15161a';
const PANEL_FILL = 'rgba(255, 255, 255, 0.025)';
const PANEL_STROKE = 'rgba(242, 236, 226, 0.1)';
const TEXT_COLOR = 'rgba(242, 236, 226, 0.92)';
const OUTER_MARGIN_X = 26;
const OUTER_MARGIN_Y = 22;
const PANEL_GAP_X = 54;
const PANEL_GAP_Y = 42;
const PANEL_PADDING_X = 18;
const PANEL_PADDING_Y = 18;
const PANEL_LAYOUTS = [
  { id: 1, col: 0, row: 0 },
  { id: 2, col: 0, row: 1 },
  { id: 3, col: 1, row: 0 },
  { id: 4, col: 1, row: 1 },
];
const FISH_SPECS = [
  { size: 80, maxSpeed: 78, hue: 16, sat: 88, light: 62 },
  { size: 88, maxSpeed: 72, hue: 196, sat: 85, light: 64 },
  { size: 74, maxSpeed: 84, hue: 142, sat: 72, light: 56 },
];
const PANEL_TEXT_SOURCES = [
  'きょうの頁には、まだ声にならないことばが静かに並んでいる。読む前の気配だけが残っていて、視線の先で文の流れが整っていく。',
  'ここにあるのは海ではなく、文字が集まってできた面である。形が横切るたび、そこだけが抜けて白い余白のように見える。',
  'ことばは崩れず、意味も失わず、決まった位置で待ち続ける。通過した輪郭だけが、空いた場所として一瞬だけ残っていく。',
  '読み進めるというより、空白が横切っていく感覚に近い。後ろの文字は順に詰め直され、全文字が面の中に留まり続ける。',
];

let W = 0;
let H = 0;
let cellWidth = 0;
let panels = [];
let fishes = [];
let motionBounds = null;
let lastTime = 0;
let frameCount = 0;
let fpsAccum = 0;

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const area = (x1, y1, x2, y2, x3, y3) => x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2);
  const d1 = area(px, py, ax, ay, bx, by);
  const d2 = area(px, py, bx, by, cx, cy);
  const d3 = area(px, py, cx, cy, ax, ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function getMotionBounds() {
  const minX = OUTER_MARGIN_X + 40;
  const maxX = W - OUTER_MARGIN_X - 40;
  const minY = OUTER_MARGIN_Y + 34;
  const maxY = H - OUTER_MARGIN_Y - 34;
  return { minX, maxX, minY, maxY };
}

class FishMask {
  constructor(spec) {
    this.size = spec.size;
    this.maxSpeed = spec.maxSpeed;
    this.hue = spec.hue;
    this.sat = spec.sat;
    this.light = spec.light;
    this.angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(this.angle) * this.maxSpeed * 0.7;
    this.vy = Math.sin(this.angle) * this.maxSpeed * 0.7;
    this.wanderPhase = Math.random() * Math.PI * 2;
    this.wanderSpeed = 0.9 + Math.random() * 0.8;
    this.targetX = 0;
    this.targetY = 0;
    this.pickTarget();
    this.x = 0;
    this.y = 0;
  }

  pickTarget() {
    this.targetX = randomBetween(motionBounds.minX, motionBounds.maxX);
    this.targetY = randomBetween(motionBounds.minY, motionBounds.maxY);
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  update(dt, timestamp, allFishes) {
    const toTargetX = this.targetX - this.x;
    const toTargetY = this.targetY - this.y;
    const targetDistance = Math.hypot(toTargetX, toTargetY);

    if (targetDistance < this.size * 0.9) {
      this.pickTarget();
    }

    const targetAngle = Math.atan2(toTargetY, toTargetX);
    this.wanderPhase += dt * this.wanderSpeed;
    const wanderAngle = targetAngle + Math.sin(this.wanderPhase) * 0.8;

    let ax = Math.cos(wanderAngle) * 52;
    let ay = Math.sin(wanderAngle) * 52;

    for (const other of allFishes) {
      if (other === this) {
        continue;
      }

      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const distance = Math.hypot(dx, dy) || 0.0001;
      const minDistance = (this.size + other.size) * 0.92;

      if (distance < minDistance) {
        const force = 1 - distance / minDistance;
        ax += (dx / distance) * force * 260;
        ay += (dy / distance) * force * 260;
      }
    }

    if (this.x < motionBounds.minX) {
      ax += (motionBounds.minX - this.x) * 8;
    }
    if (this.x > motionBounds.maxX) {
      ax -= (this.x - motionBounds.maxX) * 8;
    }
    if (this.y < motionBounds.minY) {
      ay += (motionBounds.minY - this.y) * 8;
    }
    if (this.y > motionBounds.maxY) {
      ay -= (this.y - motionBounds.maxY) * 8;
    }

    this.vx += ax * dt;
    this.vy += ay * dt;

    const speed = Math.hypot(this.vx, this.vy) || 0.0001;
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = clamp(this.x, motionBounds.minX, motionBounds.maxX);
    this.y = clamp(this.y, motionBounds.minY, motionBounds.maxY);

    if (Math.hypot(this.vx, this.vy) > 8) {
      this.angle = Math.atan2(this.vy, this.vx);
    } else {
      this.angle = Math.atan2(Math.sin(timestamp * 0.001 + this.wanderPhase), Math.cos(timestamp * 0.001 + this.wanderPhase));
    }
  }

  toLocal(px, py, angle = this.angle, x = this.x, y = this.y) {
    const dx = px - x;
    const dy = py - y;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
      x: dx * cos + dy * sin,
      y: -dx * sin + dy * cos,
    };
  }

  contains(px, py, override = null) {
    const angle = override?.angle ?? this.angle;
    const centerX = override?.x ?? this.x;
    const centerY = override?.y ?? this.y;
    const local = this.toLocal(px, py, angle, centerX, centerY);
    const lx = local.x;
    const ly = local.y;
    const s = this.size;

    const bodyDx = lx - s * 0.1;
    const bodyDy = ly;
    const body = (bodyDx * bodyDx) / (s * s * 1.18) + (bodyDy * bodyDy) / (s * s * 0.24) <= 1;

    const tail = pointInTriangle(
      lx,
      ly,
      -s * 1.18, 0,
      -s * 0.46, -s * 0.48,
      -s * 0.46, s * 0.48
    );

    const fin = pointInTriangle(
      lx,
      ly,
      -s * 0.08, -s * 0.06,
      s * 0.14, -s * 0.56,
      s * 0.48, -s * 0.08
    );

    return body || tail || fin;
  }

  draw(context) {
    const s = this.size;
    const fillColor = `hsla(${this.hue}, ${this.sat}%, ${this.light}%, 0.16)`;
    const strokeColor = `hsla(${this.hue}, ${this.sat}%, ${this.light + 10}%, 0.72)`;

    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.angle);

    context.beginPath();
    context.moveTo(-s * 1.18, 0);
    context.lineTo(-s * 0.46, -s * 0.48);
    context.quadraticCurveTo(s * 0.04, -s * 0.7, s * 1.04, 0);
    context.quadraticCurveTo(s * 0.04, s * 0.7, -s * 0.46, s * 0.48);
    context.closePath();
    context.fillStyle = fillColor;
    context.fill();
    context.strokeStyle = strokeColor;
    context.lineWidth = 1.2;
    context.stroke();

    context.beginPath();
    context.moveTo(-s * 0.08, -s * 0.06);
    context.lineTo(s * 0.14, -s * 0.56);
    context.lineTo(s * 0.48, -s * 0.08);
    context.closePath();
    context.fillStyle = `hsla(${this.hue}, ${this.sat}%, ${this.light + 8}%, 0.18)`;
    context.fill();
    context.strokeStyle = strokeColor;
    context.stroke();

    context.restore();
  }
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
}

function getSampleCellWidth() {
  const samples = ['あ', '漢', '語', '白', '余', '輪', 'W', 'M'];
  let widest = 0;

  for (const sample of samples) {
    widest = Math.max(widest, ctx.measureText(sample).width);
  }

  return Math.ceil(widest * 1.22);
}

function createPanel(layout, width, height) {
  const x = OUTER_MARGIN_X + layout.col * (width + PANEL_GAP_X);
  const y = OUTER_MARGIN_Y + layout.row * (height + PANEL_GAP_Y);
  const innerX = x + PANEL_PADDING_X;
  const innerY = y + PANEL_PADDING_Y;
  const innerWidth = width - PANEL_PADDING_X * 2;
  const innerHeight = height - PANEL_PADDING_Y * 2;
  const cols = Math.max(5, Math.floor(innerWidth / cellWidth));
  const rows = Math.max(4, Math.floor(innerHeight / LINE_HEIGHT));
  const offsetX = innerX + (innerWidth - cols * cellWidth) * 0.5;
  const offsetY = innerY + (innerHeight - rows * LINE_HEIGHT) * 0.5;
  const slots = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      slots.push({
        x: offsetX + col * cellWidth + cellWidth * 0.5,
        y: offsetY + row * LINE_HEIGHT + LINE_HEIGHT * 0.5,
      });
    }
  }

  return {
    id: layout.id,
    row: layout.row,
    col: layout.col,
    x,
    y,
    width,
    height,
    slots,
    chars: [],
  };
}

function buildPanels() {
  cellWidth = getSampleCellWidth();
  panels = [];

  const panelWidth = Math.max(260, (W - OUTER_MARGIN_X * 2 - PANEL_GAP_X) / 2);
  const panelHeight = Math.max(180, (H - OUTER_MARGIN_Y * 2 - PANEL_GAP_Y) / 2);

  for (const layout of PANEL_LAYOUTS) {
    panels.push(createPanel(layout, panelWidth, panelHeight));
  }
}

function estimateMaxBlockedSlots(panel, spec) {
  const candidateAngles = [0, Math.PI / 6, Math.PI / 3, Math.PI / 2, (2 * Math.PI) / 3, (5 * Math.PI) / 6];
  let maxBlocked = 0;

  for (const slot of panel.slots) {
    for (const angle of candidateAngles) {
      let blocked = 0;

      for (const panelSlot of panel.slots) {
        const probe = {
          x: slot.x,
          y: slot.y,
          angle,
        };

        const fish = {
          x: slot.x,
          y: slot.y,
          angle,
          size: spec.size,
          contains: FishMask.prototype.contains,
          toLocal: FishMask.prototype.toLocal,
        };

        if (fish.contains(panelSlot.x, panelSlot.y, probe)) {
          blocked += 1;
        }
      }

      maxBlocked = Math.max(maxBlocked, blocked);
    }
  }

  return maxBlocked;
}

function buildFixedChars(source, length) {
  const sourceChars = [...source];
  const chars = [];

  while (chars.length < length) {
    for (const char of sourceChars) {
      if (chars.length >= length) {
        break;
      }
      chars.push(char);
    }
  }

  return chars;
}

function assignPanelTexts() {
  let totalChars = 0;
  const totalWorstBlocked = FISH_SPECS.reduce((sum, spec) => {
    return sum + estimateMaxBlockedSlots(panels[0], spec);
  }, 0);

  for (let index = 0; index < panels.length; index += 1) {
    const panel = panels[index];
    const spareSlots = Math.max(4, Math.floor(panel.slots.length * 0.08));
    const fixedLength = Math.max(0, panel.slots.length - totalWorstBlocked - spareSlots);
    panel.chars = buildFixedChars(PANEL_TEXT_SOURCES[index], fixedLength);
    totalChars += panel.chars.length;
  }

  charEl.textContent = `${totalChars} chars`;
}

function placeFishes() {
  fishes = FISH_SPECS.map((spec) => new FishMask(spec));

  for (let index = 0; index < fishes.length; index += 1) {
    const fish = fishes[index];
    let placed = false;

    for (let attempts = 0; attempts < 200; attempts += 1) {
      const x = randomBetween(motionBounds.minX, motionBounds.maxX);
      const y = randomBetween(motionBounds.minY, motionBounds.maxY);
      let overlaps = false;

      for (let otherIndex = 0; otherIndex < index; otherIndex += 1) {
        const other = fishes[otherIndex];
        const distance = Math.hypot(x - other.x, y - other.y);
        if (distance < (fish.size + other.size) * 0.95) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        fish.setPosition(x, y);
        fish.pickTarget();
        placed = true;
        break;
      }
    }

    if (!placed) {
      fish.setPosition(
        randomBetween(motionBounds.minX, motionBounds.maxX),
        randomBetween(motionBounds.minY, motionBounds.maxY)
      );
      fish.pickTarget();
    }
  }
}

function rebuildScene() {
  resizeCanvas();
  motionBounds = getMotionBounds();
  buildPanels();
  assignPanelTexts();
  placeFishes();
}

function updateFps(dt) {
  frameCount += 1;
  fpsAccum += dt;

  if (fpsAccum >= 0.5) {
    fpsEl.textContent = `${Math.round(frameCount / fpsAccum)} FPS`;
    frameCount = 0;
    fpsAccum = 0;
  }
}

function resolveFishCollisions() {
  for (let index = 0; index < fishes.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < fishes.length; otherIndex += 1) {
      const fishA = fishes[index];
      const fishB = fishes[otherIndex];
      const dx = fishB.x - fishA.x;
      const dy = fishB.y - fishA.y;
      const distance = Math.hypot(dx, dy) || 0.0001;
      const minDistance = (fishA.size + fishB.size) * 0.92;

      if (distance < minDistance) {
        const overlap = minDistance - distance;
        const nx = dx / distance;
        const ny = dy / distance;

        fishA.x -= nx * overlap * 0.5;
        fishA.y -= ny * overlap * 0.5;
        fishB.x += nx * overlap * 0.5;
        fishB.y += ny * overlap * 0.5;

        fishA.vx -= nx * overlap * 3;
        fishA.vy -= ny * overlap * 3;
        fishB.vx += nx * overlap * 3;
        fishB.vy += ny * overlap * 3;
      }
    }
  }
}

function drawBackground() {
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, W, H);
}

function drawPanels() {
  for (const panel of panels) {
    ctx.fillStyle = PANEL_FILL;
    ctx.fillRect(panel.x, panel.y, panel.width, panel.height);
    ctx.strokeStyle = PANEL_STROKE;
    ctx.lineWidth = 1;
    ctx.strokeRect(panel.x + 0.5, panel.y + 0.5, panel.width - 1, panel.height - 1);
  }
}

function getAvailableSlots(panel) {
  const available = [];

  for (const slot of panel.slots) {
    let blocked = false;

    for (const fish of fishes) {
      if (fish.contains(slot.x, slot.y)) {
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      available.push(slot);
    }
  }

  return available;
}

function drawText() {
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const panel of panels) {
    const availableSlots = getAvailableSlots(panel);
    const count = Math.min(panel.chars.length, availableSlots.length);

    for (let index = 0; index < count; index += 1) {
      const slot = availableSlots[index];
      ctx.fillText(panel.chars[index], slot.x, slot.y);
    }
  }
}

function drawFishes() {
  for (const fish of fishes) {
    fish.draw(ctx);
  }
}

function loop(timestamp) {
  requestAnimationFrame(loop);

  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  updateFps(dt);

  for (const fish of fishes) {
    fish.update(dt, timestamp, fishes);
  }

  resolveFishCollisions();
  drawBackground();
  drawPanels();
  drawText();
  drawFishes();
}

window.addEventListener('resize', rebuildScene);

document.fonts.ready.then(() => {
  rebuildScene();
  lastTime = performance.now();
  requestAnimationFrame(loop);
});
