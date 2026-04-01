const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const fpsEl = document.getElementById('fps-counter');
const charEl = document.getElementById('char-count');
const startScreenEl = document.getElementById('start-screen');
const toggleInputButton = document.getElementById('toggle-input-button');
const startButton = document.getElementById('start-button');
const textModalEl = document.getElementById('text-modal');
const closeInputButton = document.getElementById('close-input-button');
const applyInputButton = document.getElementById('apply-input-button');
const textInputEl = document.getElementById('source-text');

const PRIMARY_FONT_NAME = 'Kiwi Maru';
const FONT_FAMILY = `"${PRIMARY_FONT_NAME}", "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif`;
const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 22;
const LINE_HEIGHT_RATIO = 1.72;
const CJK_WIDTH_RATIO = 1.28;
const TARGET_VISIBLE_CHARS = 600;
const A4_ASPECT_RATIO = 1 / Math.sqrt(2);
const TEXT_FLOW_INTERVAL_MS = 100;
const TEXT_CLEARANCE_MULTIPLIER = 1.18;
const FONT_LOAD_TIMEOUT_MS = 3000;
const RESIZE_DEBOUNCE_MS = 180;
const LAYOUT_SAMPLES = ['あ', '海', '頁', '魚', '羊', '紙', 'う', 'ね', '書', '読', '語', '灯', '余', '白'];

const TEXT_COLOR = 'rgba(42, 30, 21, 0.88)';
const PANEL_BORDER = 'rgba(126, 92, 53, 0.34)';
const PANEL_SHADOW = 'rgba(45, 29, 17, 0.28)';
const FISH_FILL = 'rgba(82, 97, 126, 0.34)';
const FISH_STROKE = 'rgba(50, 55, 73, 0.92)';
const FISH_ACCENT = 'rgba(138, 153, 182, 0.36)';
const FISH_EYE = 'rgba(28, 22, 18, 0.92)';

const DEFAULT_BOOK_TEXT_SOURCE = `
ページの真ん中に置かれた羊皮紙は、ひとつの海のようでもあり、誰かの机の上にひっそり残された長い手紙のようでもある。乾いた繊維の目を追っていくと、昨日の午後に零れた光、まだ名前のつかない感情、言いそびれた約束、ずっと胸の底に沈めた小さな願いが、丸い文字になってゆっくり立ちのぼってくる。読んでいるはずなのに、読んでいるというより、耳を澄ませて紙のぬくもりを聴いているような気持ちになる。ひと文字ごとに呼吸があり、行と行のあいだには、言葉になる前のためらいが薄く積もっている。

この頁には急ぐための筋道がない。はじめから終わりへ一直線に進むかわりに、指先を止めた場所から、ふいに別の思い出がつながっていく。たとえば、夕暮れの川面に映っていた橙色の雲。たとえば、遠い日の帰り道で、ポケットの中の飴玉がゆっくり溶けていったこと。たとえば、何も言わないまま隣を歩いた人の歩幅だけが、妙にあたたかく記憶に残っていること。そうした細い断片が、墨のようなやわらかな色で並び、紙のうえに静かな流れをつくっている。そこへ一匹の魚が現れて、うねうねと身をくねらせながら横切っていくたび、文字は消えるのではなく、一瞬だけ息をひそめる。

魚は飾りではない。読んでいる側の胸の奥で、まだ言葉になっていないものが形を借りて泳いでいる。行をまたぎ、段落をまたぎ、まるで心拍に合わせるように身をよじりながら進むその影は、紙の白さを揺らし、文の輪郭にわずかな空白をつくる。けれど、その空白は欠落ではなく、むしろ読めなかったはずの気配を見えるようにする余白だ。すべてを読み切るためではなく、読み切れないものと並んで座るために、この頁はここにある。眺めているうちに、言葉は景色になり、景色はまた、心の中で別の言葉へほどけていく。

だからこの本では、意味は前に進むためだけに使われない。意味はときどき立ち止まり、紙のしみや掠れに触れ、余白の涼しさに目を細め、魚の尾が残した揺れを見送る。丸い文字がゆったり並ぶのは、強く主張したいからではなく、誰かの内側に静かに着地したいからだ。読み終えたあとに残るのは、結論ではなく、ほんの少し呼吸の深くなった身体かもしれない。もしこの頁が、今日のあなたの中にまだ形を持たない思いを受け止められたなら、そのときはたぶん、羊皮紙の海もまた、ひそかにあなたを読んでいたのだと思う。
`.trim();

let bookTextSource = DEFAULT_BOOK_TEXT_SOURCE;

let W = 0;
let H = 0;
let dpr = 1;
let panel = null;
let fish = null;
let motionBounds = null;
let backdropTexture = null;
let paperTexture = null;
let lastTime = 0;
let frameCount = 0;
let fpsAccum = 0;
let resizeTimer = 0;
let sceneReady = false;
let flowTargets = [];
let lastTextFlowUpdate = 0;
let appInitialized = false;
let experienceStarted = false;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function shortestAngleDiff(from, to) {
  let diff = (to - from + Math.PI) % (Math.PI * 2);
  if (diff < 0) {
    diff += Math.PI * 2;
  }
  return diff - Math.PI;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(vectorX, vectorY) {
  const length = Math.hypot(vectorX, vectorY) || 1;
  return {
    x: vectorX / length,
    y: vectorY / length,
  };
}

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const area = (x1, y1, x2, y2, x3, y3) => x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2);
  const d1 = area(px, py, ax, ay, bx, by);
  const d2 = area(px, py, bx, by, cx, cy);
  const d3 = area(px, py, cx, cy, ax, ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function pointInOrientedEllipse(px, py, cx, cy, angle, rx, ry) {
  const dx = px - cx;
  const dy = py - cy;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const localX = dx * cos + dy * sin;
  const localY = -dx * sin + dy * cos;
  return (localX * localX) / (rx * rx) + (localY * localY) / (ry * ry) <= 1;
}

function roundRectPath(context, x, y, width, height, radius) {
  const r = Math.min(radius, width * 0.5, height * 0.5);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function traceSmoothLine(context, points) {
  if (!points.length) {
    return;
  }

  context.moveTo(points[0].x, points[0].y);

  if (points.length === 1) {
    return;
  }

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) * 0.5;
    const midY = (current.y + next.y) * 0.5;
    context.quadraticCurveTo(current.x, current.y, midX, midY);
  }

  const last = points[points.length - 1];
  context.lineTo(last.x, last.y);
}

function createFont(fontSize) {
  return `300 ${fontSize}px ${FONT_FAMILY}`;
}

function getLineHeight(fontSize) {
  return Math.round(fontSize * LINE_HEIGHT_RATIO);
}

function getTextClearance(cellWidth, lineHeight) {
  return Math.max(12, (cellWidth * 0.46 + lineHeight * 0.22) * TEXT_CLEARANCE_MULTIPLIER);
}

function normalizeSourceText(source) {
  const normalized = `${source || ''}`.replace(/\r\n?/g, '\n').trim();
  return normalized || DEFAULT_BOOK_TEXT_SOURCE;
}

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.max(1, Math.floor(W * dpr));
  canvas.height = Math.max(1, Math.floor(H * dpr));
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
}

function addNoise(context, width, height, amount) {
  const image = context.getImageData(0, 0, width, height);
  const { data } = image;

  for (let index = 0; index < data.length; index += 4) {
    const drift = (Math.random() - 0.5) * amount;
    data[index] = clamp(data[index] + drift, 0, 255);
    data[index + 1] = clamp(data[index + 1] + drift * 0.9, 0, 255);
    data[index + 2] = clamp(data[index + 2] - drift * 0.28, 0, 255);
  }

  context.putImageData(image, 0, 0);
}

function createBackdropTexture(width, height) {
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.max(1, Math.floor(width));
  offscreen.height = Math.max(1, Math.floor(height));
  const offCtx = offscreen.getContext('2d');

  const gradient = offCtx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#4a382a');
  gradient.addColorStop(0.45, '#2e241c');
  gradient.addColorStop(1, '#171311');
  offCtx.fillStyle = gradient;
  offCtx.fillRect(0, 0, width, height);

  const glow = offCtx.createRadialGradient(
    width * 0.5,
    height * 0.42,
    Math.min(width, height) * 0.12,
    width * 0.5,
    height * 0.42,
    Math.max(width, height) * 0.76
  );
  glow.addColorStop(0, 'rgba(255, 232, 194, 0.12)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  offCtx.fillStyle = glow;
  offCtx.fillRect(0, 0, width, height);

  addNoise(offCtx, offscreen.width, offscreen.height, 16);

  for (let index = 0; index < 18; index += 1) {
    const radius = randomBetween(Math.min(width, height) * 0.04, Math.min(width, height) * 0.16);
    const x = randomBetween(-radius, width + radius);
    const y = randomBetween(-radius, height + radius);
    const stain = offCtx.createRadialGradient(x, y, 0, x, y, radius);
    stain.addColorStop(0, 'rgba(255, 224, 174, 0.06)');
    stain.addColorStop(1, 'rgba(0, 0, 0, 0)');
    offCtx.fillStyle = stain;
    offCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  return offscreen;
}

function createPaperTexture(width, height) {
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.max(1, Math.floor(width));
  offscreen.height = Math.max(1, Math.floor(height));
  const offCtx = offscreen.getContext('2d');

  const gradient = offCtx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f6ecd5');
  gradient.addColorStop(0.45, '#eddcbc');
  gradient.addColorStop(1, '#f8efdc');
  offCtx.fillStyle = gradient;
  offCtx.fillRect(0, 0, width, height);

  addNoise(offCtx, offscreen.width, offscreen.height, 12);

  const vignette = offCtx.createRadialGradient(
    width * 0.52,
    height * 0.44,
    Math.min(width, height) * 0.12,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.72
  );
  vignette.addColorStop(0, 'rgba(255, 249, 237, 0)');
  vignette.addColorStop(1, 'rgba(124, 89, 51, 0.14)');
  offCtx.fillStyle = vignette;
  offCtx.fillRect(0, 0, width, height);

  for (let index = 0; index < 14; index += 1) {
    const radius = randomBetween(Math.min(width, height) * 0.025, Math.min(width, height) * 0.08);
    const x = randomBetween(radius, width - radius);
    const y = randomBetween(radius, height - radius);
    const stain = offCtx.createRadialGradient(x, y, radius * 0.15, x, y, radius);
    stain.addColorStop(0, 'rgba(173, 133, 85, 0.05)');
    stain.addColorStop(0.55, 'rgba(173, 133, 85, 0.018)');
    stain.addColorStop(1, 'rgba(173, 133, 85, 0)');
    offCtx.fillStyle = stain;
    offCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  offCtx.strokeStyle = 'rgba(160, 124, 83, 0.06)';
  offCtx.lineWidth = 1;
  for (let index = 0; index < 42; index += 1) {
    const y = randomBetween(0, height);
    offCtx.beginPath();
    offCtx.moveTo(0, y);
    offCtx.bezierCurveTo(width * 0.25, y + randomBetween(-6, 6), width * 0.7, y + randomBetween(-5, 5), width, y + randomBetween(-4, 4));
    offCtx.stroke();
  }

  return offscreen;
}

function createFishMetrics(panelLayout) {
  const minDim = Math.min(panelLayout.innerWidth, panelLayout.innerHeight);
  const segmentSpacing = clamp(minDim * 0.09, 20, 34);
  const halfWidths = [
    clamp(minDim * 0.072, 20, 28),
    clamp(minDim * 0.082, 22, 32),
    clamp(minDim * 0.078, 20, 30),
    clamp(minDim * 0.068, 18, 26),
    clamp(minDim * 0.058, 15, 22),
    clamp(minDim * 0.046, 12, 18),
    clamp(minDim * 0.035, 9, 14),
  ];
  const headLength = clamp(minDim * 0.18, 54, 74);
  const tailLength = clamp(minDim * 0.12, 28, 42);

  return {
    segmentCount: halfWidths.length,
    segmentSpacing,
    halfWidths,
    headLength,
    tailLength,
    maxSpeed: clamp(minDim * 0.16, 42, 78),
    steerForce: clamp(minDim * 0.14, 36, 84),
    historyStep: Math.max(8, segmentSpacing * 0.46),
    waveAmplitude: clamp(minDim * 0.024, 8, 15),
    secondaryWaveAmplitude: clamp(minDim * 0.012, 4, 8),
    waveSpeed: randomBetween(2.1, 2.8),
    courseWaveAmplitude: randomBetween(0.16, 0.24),
    courseWaveSecondaryAmplitude: randomBetween(0.07, 0.12),
    courseWaveSpeed: randomBetween(0.95, 1.25),
    bodyLength: headLength + segmentSpacing * (halfWidths.length - 1) + tailLength,
    maxHalfWidth: Math.max(...halfWidths),
  };
}

function estimateBlockedSlots(metrics, cellWidth, lineHeight) {
  const padding = getTextClearance(cellWidth, lineHeight);
  const cellArea = Math.max(1, cellWidth * lineHeight);
  const paddedLength = metrics.bodyLength + padding * 2.5;
  const paddedWidth = metrics.maxHalfWidth * 2 + padding * 2.25;
  const bodyArea = paddedLength * paddedWidth * 0.9;
  return Math.ceil((bodyArea / cellArea) * 1.46);
}

function getSampleCellWidth() {
  let widest = 0;

  for (const sample of LAYOUT_SAMPLES) {
    widest = Math.max(widest, ctx.measureText(sample).width);
  }

  return Math.ceil(widest * 1.08);
}

function getPanelRect() {
  const outerMarginX = clamp(W * 0.045, 16, 42);
  const outerMarginY = clamp(H * 0.045, 16, 42);
  const targetAspect = A4_ASPECT_RATIO;
  const isPortrait = H > W || W < 900;

  let width;
  let height;

  if (isPortrait) {
    const maxWidth = Math.max(220, W - outerMarginX * 2);
    const preferredWidth = Math.max(Math.min(300, maxWidth), W * 0.88);
    width = Math.min(maxWidth, preferredWidth);
    height = Math.min(H - outerMarginY * 2, width / targetAspect);
  } else {
    height = Math.min(H - outerMarginY * 2, H * 0.86);
    width = Math.min(W - outerMarginX * 2, height * targetAspect);
    const minPreferredWidth = Math.min(300, W - outerMarginX * 2);
    if (width < minPreferredWidth) {
      width = minPreferredWidth;
      height = Math.min(H - outerMarginY * 2, width / targetAspect);
    }
  }

  width = Math.min(width, W - outerMarginX * 2);
  height = Math.min(height, H - outerMarginY * 2);

  const x = (W - width) * 0.5;
  const y = (H - height) * 0.5;
  const paddingX = clamp(width * 0.07, 20, 42);
  const paddingY = clamp(height * 0.055, 20, 48);
  const radius = clamp(Math.min(width, height) * 0.038, 18, 28);

  return {
    x,
    y,
    width,
    height,
    radius,
    innerX: x + paddingX,
    innerY: y + paddingY,
    innerWidth: Math.max(120, width - paddingX * 2),
    innerHeight: Math.max(200, height - paddingY * 2),
  };
}

function estimateFontSize(panelRect) {
  const area = panelRect.innerWidth * panelRect.innerHeight;
  const blockedBudget = clamp(Math.round(area / 13500), 28, 54);
  const spareBudget = clamp(Math.round(area / 15000), 16, 42);
  const slotBudget = TARGET_VISIBLE_CHARS + blockedBudget + spareBudget;
  const estimated = Math.sqrt(area / (slotBudget * CJK_WIDTH_RATIO * LINE_HEIGHT_RATIO));
  return clamp(estimated, MIN_FONT_SIZE, MAX_FONT_SIZE);
}

function buildSourceLines(source, maxChars) {
  const normalizedSource = normalizeSourceText(source);
  const rawLines = normalizedSource.split('\n');
  const lines = [];
  let remaining = Math.max(0, maxChars);
  let glyphCount = 0;

  for (const rawLine of rawLines) {
    if (remaining <= 0) {
      break;
    }

    const chars = [...rawLine];
    const visibleChars = chars.slice(0, remaining);
    lines.push(visibleChars);
    glyphCount += visibleChars.length;
    remaining -= visibleChars.length;
  }

  return {
    lines,
    glyphCount,
  };
}

function buildPanel() {
  const panelRect = getPanelRect();
  const fontSize = estimateFontSize(panelRect);
  const lineHeight = getLineHeight(fontSize);
  ctx.font = createFont(fontSize);

  const cellWidth = getSampleCellWidth();
  const cols = Math.max(8, Math.floor(panelRect.innerWidth / cellWidth));
  const rows = Math.max(12, Math.floor(panelRect.innerHeight / lineHeight));
  const slotWidth = cols * cellWidth;
  const slotHeight = rows * lineHeight;
  const offsetX = panelRect.innerX + (panelRect.innerWidth - slotWidth) * 0.5;
  const offsetY = panelRect.innerY + (panelRect.innerHeight - slotHeight) * 0.5;
  const slots = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      slots.push({
        x: offsetX + col * cellWidth + cellWidth * 0.5,
        y: offsetY + row * lineHeight + lineHeight * 0.5,
      });
    }
  }

  const fishMetrics = createFishMetrics(panelRect);
  const blockedSlots = estimateBlockedSlots(fishMetrics, cellWidth, lineHeight);
  const spareSlots = Math.max(12, Math.round(slots.length * 0.06));
  const visibleTarget = Math.min(TARGET_VISIBLE_CHARS, Math.max(120, slots.length - blockedSlots - spareSlots));
  const textContent = buildSourceLines(bookTextSource, visibleTarget);
  const rowCenters = Array.from({ length: rows }, (_, row) => offsetY + row * lineHeight + lineHeight * 0.5);

  return {
    ...panelRect,
    fontSize,
    lineHeight,
    cellWidth,
    cols,
    rows,
    slots,
    rowCenters,
    fishMetrics,
    blockedSlots,
    spareSlots,
    textClearance: getTextClearance(cellWidth, lineHeight),
    visibleTarget,
    textLines: textContent.lines,
    textGlyphCount: textContent.glyphCount,
  };
}

function getMotionBounds(layout) {
  const marginX = layout.fishMetrics.headLength * 0.72 + layout.textClearance * 0.6;
  const marginY = layout.fishMetrics.maxHalfWidth * 1.35 + layout.textClearance * 0.55;
  return {
    minX: layout.innerX + marginX,
    maxX: layout.innerX + layout.innerWidth - marginX,
    minY: layout.innerY + marginY,
    maxY: layout.innerY + layout.innerHeight - marginY,
  };
}

class SegmentedFish {
  constructor(metrics, bounds) {
    this.metrics = metrics;
    this.bounds = bounds;
    this.x = randomBetween(bounds.minX, bounds.maxX);
    this.y = randomBetween(bounds.minY, bounds.maxY);
    this.heading = Math.random() * Math.PI * 2;
    this.speed = this.metrics.maxSpeed * randomBetween(0.52, 0.66);
    this.turnVelocity = 0;
    this.vx = Math.cos(this.heading) * this.speed;
    this.vy = Math.sin(this.heading) * this.speed;
    this.targetX = 0;
    this.targetY = 0;
    this.wavePhase = Math.random() * Math.PI * 2;
    this.driftPhase = Math.random() * Math.PI * 2;
    this.history = [];
    this.segments = [];
    this.maxHistoryPoints = Math.ceil((this.metrics.bodyLength + this.metrics.segmentSpacing * 6) / this.metrics.historyStep) + 24;
    this.pickTarget();
    this.seedHistory();
    this.updateSegments(performance.now());
  }

  pickTarget() {
    const minDistance = this.metrics.segmentSpacing * 6.2;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const targetX = randomBetween(this.bounds.minX, this.bounds.maxX);
      const targetY = randomBetween(this.bounds.minY, this.bounds.maxY);

      if (Math.hypot(targetX - this.x, targetY - this.y) >= minDistance) {
        this.targetX = targetX;
        this.targetY = targetY;
        return;
      }
    }

    this.targetX = randomBetween(this.bounds.minX, this.bounds.maxX);
    this.targetY = randomBetween(this.bounds.minY, this.bounds.maxY);
  }

  seedHistory() {
    this.history = [];

    for (let index = 0; index < this.maxHistoryPoints; index += 1) {
      this.history.push({
        x: this.x - Math.cos(this.heading) * this.metrics.historyStep * index,
        y: this.y - Math.sin(this.heading) * this.metrics.historyStep * index,
      });
    }
  }

  updateHistory() {
    const headPoint = { x: this.x, y: this.y };

    if (!this.history.length) {
      this.history.push(headPoint);
      return;
    }

    if (distance(headPoint, this.history[0]) >= this.metrics.historyStep) {
      this.history.unshift(headPoint);
    } else {
      this.history[0] = headPoint;
    }

    if (this.history.length > this.maxHistoryPoints) {
      this.history.length = this.maxHistoryPoints;
    }
  }

  sampleHistory(distanceFromHead) {
    let remaining = distanceFromHead;

    for (let index = 0; index < this.history.length - 1; index += 1) {
      const current = this.history[index];
      const next = this.history[index + 1];
      const segmentDistance = distance(current, next) || 0.0001;

      if (remaining <= segmentDistance) {
        const t = remaining / segmentDistance;
        return {
          x: lerp(current.x, next.x, t),
          y: lerp(current.y, next.y, t),
        };
      }

      remaining -= segmentDistance;
    }

    const fallback = this.history[this.history.length - 1] || { x: this.x, y: this.y };
    return { x: fallback.x, y: fallback.y };
  }

  update(dt, timestamp) {
    const toTargetX = this.targetX - this.x;
    const toTargetY = this.targetY - this.y;
    const targetDistance = Math.hypot(toTargetX, toTargetY);

    if (targetDistance < this.metrics.segmentSpacing * 2.4) {
      this.pickTarget();
    }

    this.wavePhase += dt * this.metrics.waveSpeed;
    const targetAngle = Math.atan2(toTargetY, toTargetX);
    const centerX = (this.bounds.minX + this.bounds.maxX) * 0.5;
    const centerY = (this.bounds.minY + this.bounds.maxY) * 0.5;
    const toCenterAngle = Math.atan2(centerY - this.y, centerX - this.x);
    const horizontalBias = Math.min(
      1,
      Math.max(0, (Math.abs(this.x - centerX) - (this.bounds.maxX - this.bounds.minX) * 0.18) / ((this.bounds.maxX - this.bounds.minX) * 0.26))
    );
    const verticalBias = Math.min(
      1,
      Math.max(0, (Math.abs(this.y - centerY) - (this.bounds.maxY - this.bounds.minY) * 0.18) / ((this.bounds.maxY - this.bounds.minY) * 0.26))
    );
    const centerBias = Math.max(horizontalBias, verticalBias);
    const courseWaveAngle =
      Math.sin(timestamp * 0.0011 * this.metrics.courseWaveSpeed + this.driftPhase) * this.metrics.courseWaveAmplitude +
      Math.sin(timestamp * 0.0019 * this.metrics.courseWaveSpeed + this.wavePhase * 0.6) * this.metrics.courseWaveSecondaryAmplitude;
    const driftAngle =
      Math.sin(timestamp * 0.00035 + this.driftPhase) * 0.16 +
      Math.sin(timestamp * 0.00073 + this.wavePhase * 0.35) * 0.08;
    const desiredHeading = lerp(targetAngle + driftAngle + courseWaveAngle, toCenterAngle, centerBias * 0.62);
    const turnEase = 1 - Math.exp(-dt * 3.1);
    const desiredTurn = shortestAngleDiff(this.heading, desiredHeading) * 2.05;

    this.turnVelocity = lerp(this.turnVelocity, desiredTurn, turnEase);
    this.turnVelocity = clamp(this.turnVelocity, -0.96, 0.96);
    this.heading += this.turnVelocity * dt;

    const desiredSpeed = this.metrics.maxSpeed * (
      0.54 +
      0.05 * Math.sin(timestamp * 0.00042 + this.driftPhase) +
      0.03 * Math.sin(timestamp * 0.0012 * this.metrics.courseWaveSpeed + this.wavePhase)
    );
    const speedEase = 1 - Math.exp(-dt * 2.2);
    this.speed = lerp(this.speed, desiredSpeed, speedEase);
    this.speed = clamp(this.speed, this.metrics.maxSpeed * 0.44, this.metrics.maxSpeed * 0.66);

    this.vx = Math.cos(this.heading) * this.speed;
    this.vy = Math.sin(this.heading) * this.speed;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x <= this.bounds.minX || this.x >= this.bounds.maxX) {
      this.heading = Math.PI - this.heading;
      this.turnVelocity *= 0.45;
    }
    if (this.y <= this.bounds.minY || this.y >= this.bounds.maxY) {
      this.heading = -this.heading;
      this.turnVelocity *= 0.45;
    }

    this.x = clamp(this.x, this.bounds.minX, this.bounds.maxX);
    this.y = clamp(this.y, this.bounds.minY, this.bounds.maxY);
    this.vx = Math.cos(this.heading) * this.speed;
    this.vy = Math.sin(this.heading) * this.speed;

    this.updateHistory();
    this.updateSegments(timestamp);
  }

  updateSegments(timestamp) {
    const segments = [];

    for (let index = 0; index < this.metrics.segmentCount; index += 1) {
      const along = index * this.metrics.segmentSpacing;
      const base = this.sampleHistory(along);
      const ahead = this.sampleHistory(Math.max(0, along - this.metrics.historyStep));
      const behind = this.sampleHistory(along + this.metrics.historyStep);
      const tangent = normalize(ahead.x - behind.x, ahead.y - behind.y);
      const normal = { x: -tangent.y, y: tangent.x };
      const tailBias = index / Math.max(1, this.metrics.segmentCount - 1);
      const waveStrength = 0.16 + Math.pow(tailBias, 1.35) * 0.96;
      const primaryWave = Math.sin(timestamp * 0.0022 * this.metrics.waveSpeed - index * 0.94 + this.wavePhase * 0.85);
      const secondaryWave = Math.sin(timestamp * 0.00145 * this.metrics.waveSpeed - index * 0.58 + this.driftPhase);
      const waveOffset =
        primaryWave * this.metrics.waveAmplitude * waveStrength +
        secondaryWave * this.metrics.secondaryWaveAmplitude * (0.25 + tailBias * 0.75);

      const x = base.x + normal.x * waveOffset;
      const y = base.y + normal.y * waveOffset;

      segments.push({
        x,
        y,
        angle: Math.atan2(tangent.y, tangent.x),
        tangent,
        normal,
        halfWidth: this.metrics.halfWidths[index],
        rx: index === 0 ? this.metrics.headLength * 0.56 : this.metrics.segmentSpacing * 0.82,
        ry: this.metrics.halfWidths[index],
      });
    }

    this.segments = segments;
  }

  contains(px, py, padding = 0) {
    if (!this.segments.length) {
      return false;
    }

    for (const segment of this.segments) {
      if (pointInOrientedEllipse(px, py, segment.x, segment.y, segment.angle, segment.rx + padding, segment.ry + padding)) {
        return true;
      }
    }

    const finSegment = this.segments[Math.min(2, this.segments.length - 1)];
    const finBaseA = {
      x: finSegment.x - finSegment.tangent.x * (this.metrics.segmentSpacing * 0.12 + padding * 0.15) + finSegment.normal.x * (finSegment.halfWidth * 0.55 + padding * 0.35),
      y: finSegment.y - finSegment.tangent.y * (this.metrics.segmentSpacing * 0.12 + padding * 0.15) + finSegment.normal.y * (finSegment.halfWidth * 0.55 + padding * 0.35),
    };
    const finBaseB = {
      x: finSegment.x + finSegment.tangent.x * (this.metrics.segmentSpacing * 0.24 + padding * 0.15) + finSegment.normal.x * (finSegment.halfWidth * 0.1 + padding * 0.18),
      y: finSegment.y + finSegment.tangent.y * (this.metrics.segmentSpacing * 0.24 + padding * 0.15) + finSegment.normal.y * (finSegment.halfWidth * 0.1 + padding * 0.18),
    };
    const finTip = {
      x: finSegment.x - finSegment.tangent.x * (this.metrics.segmentSpacing * 0.12 + padding * 0.1) + finSegment.normal.x * (finSegment.halfWidth * 1.95 + padding),
      y: finSegment.y - finSegment.tangent.y * (this.metrics.segmentSpacing * 0.12 + padding * 0.1) + finSegment.normal.y * (finSegment.halfWidth * 1.95 + padding),
    };

    if (pointInTriangle(px, py, finBaseA.x, finBaseA.y, finTip.x, finTip.y, finBaseB.x, finBaseB.y)) {
      return true;
    }

    const tail = this.segments[this.segments.length - 1];
    const tailBase = {
      x: tail.x - tail.tangent.x * (this.metrics.segmentSpacing * 0.55 + padding * 0.15),
      y: tail.y - tail.tangent.y * (this.metrics.segmentSpacing * 0.55 + padding * 0.15),
    };
    const tailTop = {
      x: tailBase.x + tail.normal.x * (tail.halfWidth * 1.2 + padding * 0.7),
      y: tailBase.y + tail.normal.y * (tail.halfWidth * 1.2 + padding * 0.7),
    };
    const tailBottom = {
      x: tailBase.x - tail.normal.x * (tail.halfWidth * 1.2 + padding * 0.7),
      y: tailBase.y - tail.normal.y * (tail.halfWidth * 1.2 + padding * 0.7),
    };
    const tailTip = {
      x: tail.x - tail.tangent.x * (this.metrics.tailLength + this.metrics.segmentSpacing * 0.15 + padding * 0.5),
      y: tail.y - tail.tangent.y * (this.metrics.tailLength + this.metrics.segmentSpacing * 0.15 + padding * 0.5),
    };

    return pointInTriangle(px, py, tailTop.x, tailTop.y, tailTip.x, tailTip.y, tailBottom.x, tailBottom.y);
  }

  draw(context) {
    if (!this.segments.length) {
      return;
    }

    const head = this.segments[0];
    const tail = this.segments[this.segments.length - 1];
    const nose = {
      x: head.x + head.tangent.x * this.metrics.headLength * 0.72,
      y: head.y + head.tangent.y * this.metrics.headLength * 0.72,
    };
    const leftPoints = [];
    const rightPoints = [];

    for (let index = 0; index < this.segments.length; index += 1) {
      const segment = this.segments[index];
      const taper = index === 0 ? 0.82 : 1;
      leftPoints.push({
        x: segment.x + segment.normal.x * segment.halfWidth * taper - segment.tangent.x * this.metrics.segmentSpacing * 0.08,
        y: segment.y + segment.normal.y * segment.halfWidth * taper - segment.tangent.y * this.metrics.segmentSpacing * 0.08,
      });
      rightPoints.push({
        x: segment.x - segment.normal.x * segment.halfWidth * taper - segment.tangent.x * this.metrics.segmentSpacing * 0.08,
        y: segment.y - segment.normal.y * segment.halfWidth * taper - segment.tangent.y * this.metrics.segmentSpacing * 0.08,
      });
    }

    const tailBase = {
      x: tail.x - tail.tangent.x * this.metrics.segmentSpacing * 0.55,
      y: tail.y - tail.tangent.y * this.metrics.segmentSpacing * 0.55,
    };
    const tailLeft = {
      x: tailBase.x + tail.normal.x * tail.halfWidth * 1.18,
      y: tailBase.y + tail.normal.y * tail.halfWidth * 1.18,
    };
    const tailRight = {
      x: tailBase.x - tail.normal.x * tail.halfWidth * 1.18,
      y: tailBase.y - tail.normal.y * tail.halfWidth * 1.18,
    };
    const tailTip = {
      x: tail.x - tail.tangent.x * (this.metrics.tailLength + this.metrics.segmentSpacing * 0.1),
      y: tail.y - tail.tangent.y * (this.metrics.tailLength + this.metrics.segmentSpacing * 0.1),
    };

    context.save();
    context.shadowColor = 'rgba(32, 27, 28, 0.14)';
    context.shadowBlur = 10;
    context.beginPath();
    traceSmoothLine(context, [nose, ...leftPoints, tailLeft, tailTip, tailRight, ...rightPoints.reverse(), nose]);
    context.closePath();
    context.fillStyle = FISH_FILL;
    context.fill();
    context.strokeStyle = FISH_STROKE;
    context.lineWidth = 1.5;
    context.stroke();
    context.restore();

    const finSegment = this.segments[Math.min(2, this.segments.length - 1)];
    const finA = {
      x: finSegment.x - finSegment.tangent.x * this.metrics.segmentSpacing * 0.12 + finSegment.normal.x * finSegment.halfWidth * 0.55,
      y: finSegment.y - finSegment.tangent.y * this.metrics.segmentSpacing * 0.12 + finSegment.normal.y * finSegment.halfWidth * 0.55,
    };
    const finB = {
      x: finSegment.x + finSegment.tangent.x * this.metrics.segmentSpacing * 0.24 + finSegment.normal.x * finSegment.halfWidth * 0.12,
      y: finSegment.y + finSegment.tangent.y * this.metrics.segmentSpacing * 0.24 + finSegment.normal.y * finSegment.halfWidth * 0.12,
    };
    const finTip = {
      x: finSegment.x - finSegment.tangent.x * this.metrics.segmentSpacing * 0.1 + finSegment.normal.x * finSegment.halfWidth * 1.95,
      y: finSegment.y - finSegment.tangent.y * this.metrics.segmentSpacing * 0.1 + finSegment.normal.y * finSegment.halfWidth * 1.95,
    };

    context.beginPath();
    context.moveTo(finA.x, finA.y);
    context.quadraticCurveTo(finTip.x, finTip.y, finB.x, finB.y);
    context.closePath();
    context.fillStyle = FISH_ACCENT;
    context.fill();
    context.strokeStyle = FISH_STROKE;
    context.lineWidth = 1.1;
    context.stroke();

    const eye = {
      x: head.x + head.tangent.x * this.metrics.headLength * 0.22 + head.normal.x * head.halfWidth * 0.18,
      y: head.y + head.tangent.y * this.metrics.headLength * 0.22 + head.normal.y * head.halfWidth * 0.18,
    };
    context.beginPath();
    context.arc(eye.x, eye.y, Math.max(2.4, head.halfWidth * 0.12), 0, Math.PI * 2);
    context.fillStyle = FISH_EYE;
    context.fill();

    context.beginPath();
    context.moveTo(nose.x - head.normal.x * 0.5, nose.y - head.normal.y * 0.5);
    for (let index = 0; index < this.segments.length - 1; index += 1) {
      const current = this.segments[index];
      const next = this.segments[index + 1];
      const midX = (current.x + next.x) * 0.5 + current.normal.x * current.halfWidth * 0.14;
      const midY = (current.y + next.y) * 0.5 + current.normal.y * current.halfWidth * 0.14;
      context.quadraticCurveTo(current.x, current.y, midX, midY);
    }
    context.strokeStyle = 'rgba(221, 233, 255, 0.16)';
    context.lineWidth = 1;
    context.stroke();
  }
}

function rebuildScene() {
  resizeCanvas();
  panel = buildPanel();
  motionBounds = getMotionBounds(panel);
  backdropTexture = createBackdropTexture(W, H);
  paperTexture = createPaperTexture(panel.width, panel.height);
  fish = new SegmentedFish(panel.fishMetrics, motionBounds);
  flowTargets = [];
  lastTextFlowUpdate = 0;
  updateTextFlow(performance.now(), true);
  charEl.textContent = `${panel.textGlyphCount} chars`;
}

function renderIntroFrame() {
  if (!panel) {
    return;
  }

  drawBackground();
  drawPanel();
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

function drawBackground() {
  ctx.fillStyle = '#201914';
  ctx.fillRect(0, 0, W, H);

  if (backdropTexture) {
    ctx.drawImage(backdropTexture, 0, 0, W, H);
  }
}

function drawPanel() {
  if (!panel) {
    return;
  }

  ctx.save();
  ctx.shadowColor = PANEL_SHADOW;
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 20;
  roundRectPath(ctx, panel.x, panel.y, panel.width, panel.height, panel.radius);
  ctx.fillStyle = '#eedfbe';
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRectPath(ctx, panel.x, panel.y, panel.width, panel.height, panel.radius);
  ctx.clip();

  if (paperTexture) {
    ctx.drawImage(paperTexture, panel.x, panel.y, panel.width, panel.height);
  }

  const wash = ctx.createLinearGradient(panel.x, panel.y, panel.x, panel.y + panel.height);
  wash.addColorStop(0, 'rgba(255, 250, 240, 0.2)');
  wash.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  wash.addColorStop(1, 'rgba(117, 84, 48, 0.06)');
  ctx.fillStyle = wash;
  ctx.fillRect(panel.x, panel.y, panel.width, panel.height);
  ctx.restore();

  ctx.save();
  roundRectPath(ctx, panel.x, panel.y, panel.width, panel.height, panel.radius);
  ctx.strokeStyle = PANEL_BORDER;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

function splitRowIntoSpans(slots) {
  if (!slots.length) {
    return [];
  }

  const spans = [];
  let currentSpan = [slots[0]];
  const gapThreshold = panel.cellWidth * 1.45;

  for (let index = 1; index < slots.length; index += 1) {
    const slot = slots[index];
    const previous = slots[index - 1];

    if (slot.x - previous.x > gapThreshold) {
      spans.push(currentSpan);
      currentSpan = [slot];
    } else {
      currentSpan.push(slot);
    }
  }

  spans.push(currentSpan);
  return spans;
}

function selectSpanSlots(slots, count, align) {
  if (count <= 0) {
    return [];
  }

  if (count >= slots.length) {
    return slots.map((slot) => ({ x: slot.x, y: slot.y }));
  }

  if (align === 'right') {
    return slots.slice(slots.length - count).map((slot) => ({ x: slot.x, y: slot.y }));
  }

  return slots.slice(0, count).map((slot) => ({ x: slot.x, y: slot.y }));
}

function distributeRowSlots(rowSlots, take) {
  if (!rowSlots.length || take <= 0) {
    return [];
  }

  const minFragment = 3;
  const spans = splitRowIntoSpans(rowSlots);

  if (spans.length <= 1) {
    return selectSpanSlots(rowSlots, take, 'left');
  }

  const totalCapacity = spans.reduce((sum, span) => sum + span.length, 0);
  const spanCounts = spans.map((span) => Math.round((take * span.length) / totalCapacity));
  let allocated = spanCounts.reduce((sum, count) => sum + count, 0);

  for (let index = 0; allocated > take && index < spanCounts.length; index += 1) {
    if (spanCounts[index] > 0) {
      spanCounts[index] -= 1;
      allocated -= 1;
    }
  }

  let cursor = 0;
  let guard = 0;
  while (allocated < take && guard < spans.length * 4) {
    if (spanCounts[cursor] < spans[cursor].length) {
      spanCounts[cursor] += 1;
      allocated += 1;
    }
    cursor = (cursor + 1) % spans.length;
    guard += 1;
  }

  if (spanCounts.length >= 2) {
    const first = 0;
    const last = spanCounts.length - 1;

    if (spanCounts[first] > 0 && spanCounts[first] < minFragment && take >= minFragment) {
      const add = Math.min(minFragment - spanCounts[first], spans[first].length - spanCounts[first]);
      spanCounts[first] += add;
      spanCounts[last] = Math.max(0, spanCounts[last] - add);
    }

    if (spanCounts[last] > 0 && spanCounts[last] < minFragment && take >= minFragment) {
      const add = Math.min(minFragment - spanCounts[last], spans[last].length - spanCounts[last]);
      spanCounts[last] += add;
      spanCounts[first] = Math.max(0, spanCounts[first] - add);
    }
  }

  allocated = spanCounts.reduce((sum, count) => sum + count, 0);
  for (let index = spanCounts.length - 1; allocated > take && index >= 0; index -= 1) {
    const removable = Math.min(spanCounts[index], allocated - take);
    spanCounts[index] -= removable;
    allocated -= removable;
  }

  cursor = 0;
  guard = 0;
  while (allocated < take && guard < spans.length * 4) {
    if (spanCounts[cursor] < spans[cursor].length) {
      spanCounts[cursor] += 1;
      allocated += 1;
    }
    cursor = (cursor + 1) % spans.length;
    guard += 1;
  }

  const targets = [];
  for (let spanIndex = 0; spanIndex < spans.length; spanIndex += 1) {
    const align = spanIndex === spans.length - 1 ? 'right' : 'left';
    targets.push(...selectSpanSlots(spans[spanIndex], spanCounts[spanIndex], align));
  }

  return targets;
}

function getFlowTargets() {
  if (!panel || !fish) {
    return [];
  }

  const targets = [];
  let lineIndex = 0;
  let lineOffset = 0;

  for (let row = 0; row < panel.rows && lineIndex < panel.textLines.length; row += 1) {
    const currentLine = panel.textLines[lineIndex];

    if (currentLine.length === 0) {
      lineIndex += 1;
      lineOffset = 0;
      continue;
    }

    const rowStart = row * panel.cols;
    const rowEnd = Math.min(panel.slots.length, rowStart + panel.cols);
    const rowSlots = [];

    for (let index = rowStart; index < rowEnd; index += 1) {
      const slot = panel.slots[index];
      if (!fish.contains(slot.x, slot.y, panel.textClearance)) {
        rowSlots.push(slot);
      }
    }

    if (!rowSlots.length) {
      continue;
    }

    const remainingChars = currentLine.length - lineOffset;
    if (remainingChars <= 0) {
      lineIndex += 1;
      lineOffset = 0;
      continue;
    }

    const take = Math.min(remainingChars, rowSlots.length);
    const rowTargets = distributeRowSlots(rowSlots, take);

    for (let index = 0; index < rowTargets.length; index += 1) {
      const slot = rowTargets[index];
      targets.push({
        x: slot.x,
        y: slot.y,
        char: currentLine[lineOffset + index],
      });
    }

    lineOffset += take;
    if (lineOffset >= currentLine.length) {
      lineIndex += 1;
      lineOffset = 0;
    }
  }

  return targets;
}

function updateTextFlow(timestamp, force = false) {
  if (!panel || !fish) {
    return;
  }

  if (!force && timestamp - lastTextFlowUpdate < TEXT_FLOW_INTERVAL_MS) {
    return;
  }

  const targets = getFlowTargets();
  flowTargets = targets;
  lastTextFlowUpdate = timestamp;
}

function drawText() {
  if (!panel || !flowTargets.length) {
    return;
  }

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = createFont(panel.fontSize);

  for (const slot of flowTargets) {
    ctx.fillText(slot.char, slot.x, slot.y);
  }
}

function loop(timestamp) {
  requestAnimationFrame(loop);

  if (!sceneReady || !panel || !fish) {
    return;
  }

  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  updateFps(dt);
  fish.update(dt, timestamp);
  updateTextFlow(timestamp);
  drawBackground();
  drawPanel();
  drawText();
  fish.draw(ctx);
}

function setInputModalOpen(isOpen) {
  textModalEl.hidden = !isOpen;
  toggleInputButton.setAttribute('aria-expanded', String(isOpen));
  document.body.classList.toggle('is-modal-open', isOpen);

  if (isOpen) {
    textInputEl.focus();
    const cursor = textInputEl.value.length;
    textInputEl.setSelectionRange(cursor, cursor);
  } else {
    toggleInputButton.focus();
  }
}

function startExperience() {
  if (!appInitialized || experienceStarted) {
    return;
  }

  experienceStarted = true;
  setInputModalOpen(false);
  bookTextSource = normalizeSourceText(textInputEl.value);
  rebuildScene();
  sceneReady = true;
  startScreenEl.classList.add('is-hidden');
  document.body.classList.add('is-running');
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function scheduleRebuild() {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    rebuildScene();
    if (!sceneReady) {
      renderIntroFrame();
    }
    lastTime = performance.now();
  }, RESIZE_DEBOUNCE_MS);
}

async function waitForPrimaryFont() {
  if (!document.fonts || !document.fonts.load) {
    return;
  }

  const timeout = new Promise((resolve) => {
    window.setTimeout(resolve, FONT_LOAD_TIMEOUT_MS);
  });

  await Promise.race([
    Promise.all([
      document.fonts.load(`300 20px "${PRIMARY_FONT_NAME}"`),
      document.fonts.ready,
    ]),
    timeout,
  ]);
}

window.addEventListener('resize', scheduleRebuild);
toggleInputButton.addEventListener('click', () => {
  setInputModalOpen(true);
});
closeInputButton.addEventListener('click', () => {
  setInputModalOpen(false);
});
applyInputButton.addEventListener('click', () => {
  setInputModalOpen(false);
});
textModalEl.addEventListener('click', (event) => {
  if (event.target.hasAttribute('data-close-input-modal')) {
    setInputModalOpen(false);
  }
});
startButton.addEventListener('click', startExperience);
textInputEl.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setInputModalOpen(false);
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    startExperience();
  }
});

(async () => {
  await waitForPrimaryFont();
  rebuildScene();
  renderIntroFrame();
  startButton.disabled = false;
  appInitialized = true;
})();
