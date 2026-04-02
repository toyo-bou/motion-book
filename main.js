const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const backButtonEl = document.getElementById('back-button');
const fpsEl = document.getElementById('fps-counter');
const charEl = document.getElementById('char-count');
const startScreenEl = document.getElementById('start-screen');
const toggleInputButton = document.getElementById('toggle-input-button');
const toggleConfigButton = document.getElementById('toggle-config-button');
const startButton = document.getElementById('start-button');
const textModalEl = document.getElementById('text-modal');
const closeInputButton = document.getElementById('close-input-button');
const applyInputButton = document.getElementById('apply-input-button');
const textInputEl = document.getElementById('source-text');
const configModalEl = document.getElementById('config-modal');
const closeConfigButton = document.getElementById('close-config-button');
const cancelConfigButton = document.getElementById('cancel-config-button');
const applyConfigButton = document.getElementById('apply-config-button');
const resetConfigButton = document.getElementById('reset-config-button');
const configFormEl = document.getElementById('config-form');
const fontSizeInputEl = document.getElementById('font-size-input');
const fontSizeValueEl = document.getElementById('font-size-value');
const textColorInputEl = document.getElementById('text-color-input');
const textColorValueEl = document.getElementById('text-color-value');
const fontFamilyInputEl = document.getElementById('font-family-input');
const textIntervalInputEl = document.getElementById('text-interval-input');
const textIntervalValueEl = document.getElementById('text-interval-value');
const paperColorInputEl = document.getElementById('paper-color-input');
const paperColorValueEl = document.getElementById('paper-color-value');

const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 24;
const LINE_HEIGHT_RATIO = 1.72;
const CJK_WIDTH_RATIO = 1.28;
const TARGET_VISIBLE_CHARS = 600;
const A4_ASPECT_RATIO = 1 / Math.sqrt(2);
const MIN_TEXT_FLOW_INTERVAL_MS = 50;
const MAX_TEXT_FLOW_INTERVAL_MS = 250;
const TEXT_CLEARANCE_MULTIPLIER = 1.18;
const FONT_LOAD_TIMEOUT_MS = 3000;
const RESIZE_DEBOUNCE_MS = 180;
const SETTINGS_STORAGE_KEY = 'motion-book.settings.v1';
const LAYOUT_SAMPLES = ['あ', '海', '頁', '魚', '羊', '紙', 'う', 'ね', '書', '読', '語', '灯', '余', '白'];
const SCENE_BACKGROUND_COLOR = '#1a1a2e';
const FONT_OPTIONS = Object.freeze({
  'kiwi-maru': {
    label: 'Kiwi Maru',
    loadName: 'Kiwi Maru',
    stack: '"Kiwi Maru", "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif',
  },
  'yu-gothic': {
    label: 'Yu Gothic',
    loadName: 'Yu Gothic',
    stack: '"Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif',
  },
  'm-plus-code': {
    label: 'M PLUS 1 Code',
    loadName: 'M PLUS 1 Code',
    stack: '"M PLUS 1 Code", "Hiragino Sans", "Yu Gothic", monospace',
  },
  'shippori-mincho': {
    label: 'Shippori Mincho',
    loadName: 'Shippori Mincho',
    stack: '"Shippori Mincho", "Hiragino Mincho ProN", "Yu Mincho", serif',
  },
});
const DEFAULT_SETTINGS = Object.freeze({
  fontSizePx: 18,
  textColor: '#2a2130',
  fontFamily: 'kiwi-maru',
  textFlowIntervalMs: 100,
  paperColor: '#f0e6da',
});

const PANEL_BORDER = 'rgba(120, 90, 108, 0.34)';
const PANEL_SHADOW = 'rgba(32, 24, 40, 0.28)';
const FISH_FILL = 'rgba(76, 88, 120, 0.38)';
const FISH_STROKE = 'rgba(44, 48, 72, 0.92)';
const FISH_ACCENT = 'rgba(130, 140, 176, 0.36)';
const FISH_EYE = 'rgba(24, 20, 30, 0.92)';
const SPROUT_BODY = 'rgba(248, 244, 238, 0.98)';
const SPROUT_CAP = 'rgba(220, 180, 140, 0.96)';
const SPROUT_STROKE = 'rgba(36, 28, 38, 0.96)';
const SPROUT_EYE = 'rgba(36, 28, 38, 0.96)';
const SPROUT_BLUSH = 'rgba(196, 122, 138, 0.58)';

const DEFAULT_BOOK_TEXT_SOURCE = [
  '汚れつちまつた悲しみに',
  '',
  '汚れつちまつた悲しみに',
  '今日も小雪の降りかかる',
  '汚れつちまつた悲しみに',
  '今日も風さへ吹きすぎる',
  '',
  '汚れつちまつた悲しみは',
  'たとへば狐の革裘 ',
  '汚れつちまつた悲しみは',
  '小雪のかかつてちぢこまる',
  '',
  '汚れつちまつた悲しみは',
  'なにのぞむなくねがふなく',
  '汚れつちまつた悲しみは',
  '倦怠）のうちに死を夢む',
].join('\n');

let settings = loadSettings();
let bookTextSource = DEFAULT_BOOK_TEXT_SOURCE;

let W = 0;
let H = 0;
let dpr = 1;
let panel = null;
let character = null;
let selectedCharacter = 'fish';
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
let animationFrameId = 0;

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

function pointToSegmentDistance(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const denom = abx * abx + aby * aby || 1;
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / denom, 0, 1);
  const closestX = ax + abx * t;
  const closestY = ay + aby * t;
  return Math.hypot(px - closestX, py - closestY);
}

function strokeOutlinedPath(context, outerWidth, innerWidth, outlineColor, fillColor, pathBuilder) {
  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';

  context.beginPath();
  pathBuilder(context);
  context.strokeStyle = outlineColor;
  context.lineWidth = outerWidth;
  context.stroke();

  context.beginPath();
  pathBuilder(context);
  context.strokeStyle = fillColor;
  context.lineWidth = innerWidth;
  context.stroke();

  context.restore();
}

function drawSproutBean(context, x, y, rx, ry, rotation = 0, lineWidth = 1) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);

  const beanGradient = context.createLinearGradient(-rx * 0.8, -ry, rx, ry);
  beanGradient.addColorStop(0, 'rgba(248, 240, 224, 0.98)');
  beanGradient.addColorStop(0.55, SPROUT_CAP);
  beanGradient.addColorStop(1, 'rgba(200, 160, 110, 0.96)');

  context.beginPath();
  context.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  context.fillStyle = beanGradient;
  context.fill();
  context.strokeStyle = SPROUT_STROKE;
  context.lineWidth = lineWidth;
  context.stroke();

  context.beginPath();
  context.moveTo(rx * 0.08, -ry * 0.72);
  context.quadraticCurveTo(rx * 0.2, 0, rx * 0.08, ry * 0.72);
  context.strokeStyle = 'rgba(110, 85, 75, 0.46)';
  context.lineWidth = Math.max(0.5, lineWidth * 0.72);
  context.stroke();

  context.fillStyle = 'rgba(255, 255, 255, 0.62)';
  context.beginPath();
  context.ellipse(-rx * 0.28, -ry * 0.12, rx * 0.22, ry * 0.4, -0.2, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.ellipse(rx * 0.34, -ry * 0.08, rx * 0.12, ry * 0.34, -0.08, 0, Math.PI * 2);
  context.fill();

  context.restore();
}

function drawSproutPodBean(context, x, y, rx, ry, lineWidth = 1) {
  context.save();
  context.translate(x, y);

  context.beginPath();
  context.moveTo(-rx * 1.1, ry * 0.14);
  context.quadraticCurveTo(-rx * 0.95, ry * 0.78, -rx * 0.48, ry * 0.58);
  context.quadraticCurveTo(-rx * 0.16, ry * 1.04, 0, ry * 0.56);
  context.quadraticCurveTo(rx * 0.2, ry * 1.0, rx * 0.52, ry * 0.58);
  context.quadraticCurveTo(rx * 0.9, ry * 0.82, rx * 1.12, ry * 0.18);
  context.lineTo(rx * 0.96, ry * 0.54);
  context.quadraticCurveTo(rx * 0.66, ry * 1.14, 0, ry * 1.18);
  context.quadraticCurveTo(-rx * 0.7, ry * 1.14, -rx * 0.98, ry * 0.52);
  context.closePath();
  context.fillStyle = 'rgba(246, 240, 234, 0.95)';
  context.fill();
  context.strokeStyle = SPROUT_STROKE;
  context.lineWidth = lineWidth;
  context.stroke();

  context.restore();
  drawSproutBean(context, x, y - ry * 0.18, rx * 0.92, ry * 0.92, -0.18, Math.max(0.6, lineWidth * 0.9));
}

function drawSproutStarHand(context, x, y, size, lineWidth) {
  const fingers = [
    { x: size, y: -size * 0.12 },
    { x: size * 0.26, y: -size * 0.92 },
    { x: size * 0.12, y: size * 0.88 },
    { x: -size * 0.72, y: size * 0.16 },
  ];

  context.save();
  context.translate(x, y);
  context.strokeStyle = SPROUT_STROKE;
  context.lineWidth = lineWidth;
  context.lineCap = 'round';

  for (const finger of fingers) {
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(finger.x, finger.y);
    context.stroke();
  }

  context.restore();
}

function drawSproutFairyFigure(context, metrics, pose = {}) {
  const m = metrics;
  const walkPhase = pose.walkPhase || 0;
  const bodyTopY = -m.stemHeight;
  const bodyBottomY = 0;
  const legSwing = Math.sin(walkPhase) * m.legLength * 0.08;
  const armSwing = Math.sin(walkPhase + Math.PI * 0.25) * m.armLength * 0.08;
  const podX = -m.sideBeanOffsetX;
  const podY = -m.sideBeanOffsetY + Math.cos(walkPhase * 0.8) * m.sideBeanRy * 0.08;
  const rightArmBaseX = m.stemWidth * 0.44;
  const rightArmBaseY = -m.stemHeight * 0.16;
  const rightHandX = rightArmBaseX + m.armLength;
  const rightHandY = rightArmBaseY + m.armLength * 0.24 + armSwing;
  const leftArmBaseX = -m.stemWidth * 0.4;
  const leftArmBaseY = -m.stemHeight * 0.08;

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.08)';
  context.shadowBlur = Math.max(2, m.stemWidth * 0.28);

  strokeOutlinedPath(context, m.stemWidth + 4, m.stemWidth, SPROUT_STROKE, SPROUT_BODY, (ctxRef) => {
    ctxRef.moveTo(0, bodyBottomY);
    ctxRef.bezierCurveTo(-m.bodyCurve, -m.stemHeight * 0.22, -m.bodyCurve * 0.38, -m.stemHeight * 0.7, 0, bodyTopY);
  });

  strokeOutlinedPath(context, m.hookWidth + 4, m.hookWidth, SPROUT_STROKE, SPROUT_BODY, (ctxRef) => {
    ctxRef.moveTo(0, bodyTopY);
    ctxRef.quadraticCurveTo(m.hookTipX * 0.24, bodyTopY - m.topBeanRy * 0.76, m.hookTipX, m.hookTipY);
  });

  context.shadowBlur = 0;

  context.beginPath();
  context.moveTo(-m.stemWidth * 0.16, -m.stemHeight * 0.06);
  context.bezierCurveTo(
    -m.stemWidth * 0.34, -m.stemHeight * 0.26,
    -m.stemWidth * 0.3, -m.stemHeight * 0.72,
    -m.stemWidth * 0.12, bodyTopY * 0.98
  );
  context.strokeStyle = 'rgba(240, 220, 214, 0.58)';
  context.lineWidth = Math.max(1, m.stemWidth * 0.16);
  context.lineCap = 'round';
  context.stroke();

  drawSproutBean(context, m.topBeanX, m.topBeanY, m.topBeanRx, m.topBeanRy, 0.18, Math.max(0.8, m.armWidth * 0.42));

  context.strokeStyle = SPROUT_STROKE;
  context.lineWidth = m.armWidth;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(leftArmBaseX, leftArmBaseY);
  context.quadraticCurveTo(
    leftArmBaseX - m.leftArmLength * 0.55,
    leftArmBaseY + m.leftArmLength * 0.15,
    podX + m.sideBeanRx * 0.72,
    podY + m.sideBeanRy * 0.24
  );
  context.stroke();

  drawSproutPodBean(context, podX, podY, m.sideBeanRx, m.sideBeanRy, Math.max(0.8, m.armWidth * 0.72));

  context.beginPath();
  context.moveTo(rightArmBaseX, rightArmBaseY);
  context.quadraticCurveTo(
    rightArmBaseX + m.armLength * 0.6,
    rightArmBaseY - m.armLength * 0.08 + armSwing * 0.35,
    rightHandX,
    rightHandY
  );
  context.stroke();
  drawSproutStarHand(context, rightHandX, rightHandY, m.handSize, Math.max(0.8, m.armWidth * 0.74));

  const leftLegEndX = -m.legSpread - legSwing * 0.45;
  const rightLegEndX = m.legSpread + legSwing * 0.34;
  const leftLegEndY = m.legLength;
  const rightLegEndY = m.legLength * 0.96;

  context.lineWidth = m.legWidth;
  context.beginPath();
  context.moveTo(-m.legSpread * 0.24, bodyBottomY);
  context.quadraticCurveTo(-m.legSpread * 0.62, m.legLength * 0.38, leftLegEndX, leftLegEndY);
  context.stroke();

  context.beginPath();
  context.moveTo(m.legSpread * 0.24, bodyBottomY);
  context.quadraticCurveTo(m.legSpread * 0.6, m.legLength * 0.36, rightLegEndX, rightLegEndY);
  context.stroke();

  context.lineWidth = Math.max(1, m.legWidth * 0.82);
  context.beginPath();
  context.moveTo(leftLegEndX, leftLegEndY);
  context.quadraticCurveTo(
    leftLegEndX - m.footSize * 0.2,
    leftLegEndY + m.footSize * 0.18,
    leftLegEndX - m.footSize * 0.78,
    leftLegEndY - m.footSize * 0.04
  );
  context.stroke();

  context.beginPath();
  context.moveTo(rightLegEndX, rightLegEndY);
  context.quadraticCurveTo(
    rightLegEndX + m.footSize * 0.18,
    rightLegEndY + m.footSize * 0.18,
    rightLegEndX + m.footSize * 0.78,
    rightLegEndY - m.footSize * 0.04
  );
  context.stroke();

  context.beginPath();
  context.moveTo(0, bodyBottomY + 1);
  context.lineTo(0, m.legLength * 0.52);
  context.lineWidth = Math.max(1, m.stemWidth * 0.18);
  context.stroke();

  const faceX = -m.stemWidth * 0.34;
  const faceY = bodyTopY + m.stemWidth * 1.26;
  const faceSize = Math.max(1.2, m.stemWidth * 0.18);
  context.strokeStyle = SPROUT_EYE;
  context.lineWidth = Math.max(0.9, m.armWidth * 0.5);

  context.beginPath();
  context.arc(faceX, faceY, faceSize, Math.PI * 0.16, Math.PI * 0.9);
  context.stroke();

  context.beginPath();
  context.arc(faceX + m.stemWidth * 0.6, faceY + m.stemWidth * 0.38, faceSize * 1.42, -0.12, Math.PI * 0.94);
  context.stroke();

  context.fillStyle = SPROUT_BLUSH;
  context.beginPath();
  context.ellipse(faceX + m.stemWidth * 0.16, faceY + m.stemWidth * 0.56, faceSize * 0.94, faceSize * 0.6, 0, 0, Math.PI * 2);
  context.fill();

  context.restore();
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

function traceClosedSmoothPath(context, points) {
  if (!points.length) {
    return;
  }

  if (points.length < 3) {
    context.beginPath();
    traceSmoothLine(context, points);
    context.closePath();
    return;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const startX = (last.x + first.x) * 0.5;
  const startY = (last.y + first.y) * 0.5;

  context.beginPath();
  context.moveTo(startX, startY);

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const midX = (current.x + next.x) * 0.5;
    const midY = (current.y + next.y) * 0.5;
    context.quadraticCurveTo(current.x, current.y, midX, midY);
  }

  context.closePath();
}

function createParchmentOutline(panelRect) {
  const { x, y, width, height } = panelRect;
  const notch = clamp(Math.min(width, height) * 0.018, 6, 16);
  const cornerX = clamp(width * 0.045, 16, 32);
  const cornerY = clamp(height * 0.034, 14, 30);

  return [
    { x: x + cornerX * 0.72, y: y + cornerY * 0.14 },
    { x: x + width * 0.14, y: y + notch * 0.86 },
    { x: x + width * 0.31, y: y + notch * 0.18 },
    { x: x + width * 0.49, y: y + notch },
    { x: x + width * 0.67, y: y + notch * 0.28 },
    { x: x + width * 0.86, y: y + notch * 0.94 },
    { x: x + width - cornerX * 0.74, y: y + cornerY * 0.22 },
    { x: x + width - notch * 0.26, y: y + height * 0.14 },
    { x: x + width - notch * 0.94, y: y + height * 0.34 },
    { x: x + width - notch * 0.18, y: y + height * 0.56 },
    { x: x + width - notch, y: y + height * 0.78 },
    { x: x + width - cornerX * 0.92, y: y + height - cornerY * 0.64 },
    { x: x + width * 0.82, y: y + height - notch * 0.34 },
    { x: x + width * 0.64, y: y + height - notch },
    { x: x + width * 0.42, y: y + height - notch * 0.16 },
    { x: x + width * 0.2, y: y + height - notch * 0.84 },
    { x: x + cornerX * 0.74, y: y + height - cornerY * 0.22 },
    { x: x + notch * 0.28, y: y + height * 0.8 },
    { x: x + notch * 0.98, y: y + height * 0.58 },
    { x: x + notch * 0.14, y: y + height * 0.36 },
    { x: x + cornerX * 0.56, y: y + cornerY * 0.84 },
  ];
}

function parchmentPath(context, panelLayout) {
  traceClosedSmoothPath(context, panelLayout.outlinePoints);
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
  return `300 ${fontSize}px ${getFontStack()}`;
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

function normalizeHexColor(value, fallback) {
  const fallbackValue = `${fallback || '#000000'}`.toLowerCase();
  const raw = `${value || ''}`.trim();

  if (/^#[0-9a-f]{6}$/i.test(raw)) {
    return raw.toLowerCase();
  }

  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    const expanded = raw
      .slice(1)
      .split('')
      .map((char) => `${char}${char}`)
      .join('');
    return `#${expanded}`.toLowerCase();
  }

  return fallbackValue;
}

function hexToRgb(hexColor) {
  const normalized = normalizeHexColor(hexColor, '#000000');
  const value = normalized.slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function mixRgb(color, target, amount) {
  return {
    r: Math.round(lerp(color.r, target.r, amount)),
    g: Math.round(lerp(color.g, target.g, amount)),
    b: Math.round(lerp(color.b, target.b, amount)),
  };
}

function rgbToCss(color, alpha = 1) {
  if (alpha >= 1) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }

  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function getFontOption(fontKey = settings.fontFamily) {
  return FONT_OPTIONS[fontKey] || FONT_OPTIONS[DEFAULT_SETTINGS.fontFamily];
}

function getFontStack(fontKey = settings.fontFamily) {
  return getFontOption(fontKey).stack;
}

function sanitizeSettings(candidate = {}) {
  const fontSizePx = clamp(
    Math.round(Number(candidate.fontSizePx) || DEFAULT_SETTINGS.fontSizePx),
    MIN_FONT_SIZE,
    MAX_FONT_SIZE
  );
  const intervalBase = Math.round(Number(candidate.textFlowIntervalMs) || DEFAULT_SETTINGS.textFlowIntervalMs);
  const textFlowIntervalMs = clamp(
    Math.round(intervalBase / 10) * 10,
    MIN_TEXT_FLOW_INTERVAL_MS,
    MAX_TEXT_FLOW_INTERVAL_MS
  );
  const fontFamily = FONT_OPTIONS[candidate.fontFamily] ? candidate.fontFamily : DEFAULT_SETTINGS.fontFamily;

  return {
    fontSizePx,
    textColor: normalizeHexColor(candidate.textColor, DEFAULT_SETTINGS.textColor),
    fontFamily,
    textFlowIntervalMs,
    paperColor: normalizeHexColor(
      candidate.paperColor ?? candidate.backgroundColor,
      DEFAULT_SETTINGS.paperColor
    ),
  };
}

function loadSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    return sanitizeSettings(JSON.parse(raw));
  } catch (error) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(nextSettings) {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeSettings(nextSettings)));
  } catch (error) {
    return;
  }
}

function updateConfigValueLabels() {
  fontSizeValueEl.textContent = `${fontSizeInputEl.value} px`;
  textColorValueEl.textContent = normalizeHexColor(textColorInputEl.value, DEFAULT_SETTINGS.textColor).toUpperCase();
  textIntervalValueEl.textContent = `${textIntervalInputEl.value} ms`;
  paperColorValueEl.textContent = normalizeHexColor(
    paperColorInputEl.value,
    DEFAULT_SETTINGS.paperColor
  ).toUpperCase();
}

function populateConfigForm(nextSettings = settings) {
  const safeSettings = sanitizeSettings(nextSettings);
  fontSizeInputEl.value = String(safeSettings.fontSizePx);
  textColorInputEl.value = safeSettings.textColor;
  fontFamilyInputEl.value = safeSettings.fontFamily;
  textIntervalInputEl.value = String(safeSettings.textFlowIntervalMs);
  paperColorInputEl.value = safeSettings.paperColor;
  updateConfigValueLabels();
}

function readConfigForm() {
  return sanitizeSettings({
    fontSizePx: Number(fontSizeInputEl.value),
    textColor: textColorInputEl.value,
    fontFamily: fontFamilyInputEl.value,
    textFlowIntervalMs: Number(textIntervalInputEl.value),
    paperColor: paperColorInputEl.value,
  });
}

function syncCssSettings() {
  document.documentElement.style.setProperty('--bg', SCENE_BACKGROUND_COLOR);
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
  const baseColor = hexToRgb(SCENE_BACKGROUND_COLOR);
  const topColor = mixRgb(baseColor, { r: 200, g: 190, b: 210 }, 0.18);
  const middleColor = mixRgb(baseColor, { r: 0, g: 0, b: 0 }, 0.12);
  const bottomColor = mixRgb(baseColor, { r: 0, g: 0, b: 0 }, 0.36);
  const glowColor = mixRgb(baseColor, { r: 210, g: 200, b: 220 }, 0.72);
  const stainColor = mixRgb(baseColor, { r: 200, g: 190, b: 210 }, 0.6);

  const gradient = offCtx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, rgbToCss(topColor));
  gradient.addColorStop(0.45, rgbToCss(middleColor));
  gradient.addColorStop(1, rgbToCss(bottomColor));
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
  glow.addColorStop(0, rgbToCss(glowColor, 0.12));
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  offCtx.fillStyle = glow;
  offCtx.fillRect(0, 0, width, height);

  addNoise(offCtx, offscreen.width, offscreen.height, 16);

  for (let index = 0; index < 18; index += 1) {
    const radius = randomBetween(Math.min(width, height) * 0.04, Math.min(width, height) * 0.16);
    const x = randomBetween(-radius, width + radius);
    const y = randomBetween(-radius, height + radius);
    const stain = offCtx.createRadialGradient(x, y, 0, x, y, radius);
    stain.addColorStop(0, rgbToCss(stainColor, 0.06));
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
  const baseColor = hexToRgb(settings.paperColor);
  const topColor = mixRgb(baseColor, { r: 240, g: 236, b: 232 }, 0.26);
  const middleColor = mixRgb(baseColor, { r: 120, g: 90, b: 108 }, 0.1);
  const bottomColor = mixRgb(baseColor, { r: 245, g: 240, b: 236 }, 0.18);
  const vignetteEdgeColor = mixRgb(baseColor, { r: 72, g: 52, b: 64 }, 0.42);
  const stainBaseColor = mixRgb(baseColor, { r: 112, g: 84, b: 98 }, 0.5);

  const gradient = offCtx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, rgbToCss(topColor));
  gradient.addColorStop(0.45, rgbToCss(middleColor));
  gradient.addColorStop(1, rgbToCss(bottomColor));
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
  vignette.addColorStop(1, rgbToCss(vignetteEdgeColor, 0.14));
  offCtx.fillStyle = vignette;
  offCtx.fillRect(0, 0, width, height);

  for (let index = 0; index < 14; index += 1) {
    const radius = randomBetween(Math.min(width, height) * 0.025, Math.min(width, height) * 0.08);
    const x = randomBetween(radius, width - radius);
    const y = randomBetween(radius, height - radius);
    const stain = offCtx.createRadialGradient(x, y, radius * 0.15, x, y, radius);
    stain.addColorStop(0, rgbToCss(stainBaseColor, 0.05));
    stain.addColorStop(0.55, rgbToCss(stainBaseColor, 0.018));
    stain.addColorStop(1, rgbToCss(stainBaseColor, 0));
    offCtx.fillStyle = stain;
    offCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  offCtx.strokeStyle = 'rgba(140, 110, 120, 0.06)';
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
    motionInsets: {
      left: headLength * 0.72,
      right: headLength * 0.72,
      top: Math.max(...halfWidths) * 1.35,
      bottom: Math.max(...halfWidths) * 1.35,
    },
  };
}

function createSproutMetrics(panelLayout) {
  const minDim = Math.min(panelLayout.innerWidth, panelLayout.innerHeight);
  const sproutScale = 1.1;
  const stemHeight = clamp(minDim * 0.44, 150, 250) * sproutScale;
  const stemWidth = clamp(minDim * 0.024, 14, 22) * sproutScale;
  const bodyCurve = clamp(minDim * 0.005, 2.5, 6) * sproutScale;
  const hookTipX = clamp(minDim * 0.05, 20, 34) * sproutScale;
  const topBeanRx = clamp(minDim * 0.045, 18, 30) * sproutScale;
  const topBeanRy = topBeanRx * 0.82;
  const hookTipY = -stemHeight + clamp(minDim * 0.03, 10, 18) * sproutScale;
  const topBeanX = hookTipX + topBeanRx * 0.34;
  const topBeanY = hookTipY + topBeanRy * 0.56;
  const sideBeanRx = clamp(minDim * 0.03, 12, 20) * sproutScale;
  const sideBeanRy = sideBeanRx * 0.78;
  const sideBeanOffsetX = clamp(minDim * 0.052, 20, 34) * sproutScale;
  const sideBeanOffsetY = clamp(minDim * 0.045, 12, 24) * sproutScale;
  const armLength = clamp(minDim * 0.05, 20, 34) * sproutScale;
  const leftArmLength = clamp(minDim * 0.036, 12, 24) * sproutScale;
  const legLength = clamp(minDim * 0.05, 18, 30) * sproutScale;
  const legSpread = clamp(minDim * 0.02, 8, 14) * sproutScale;
  const footSize = clamp(minDim * 0.018, 6, 11) * sproutScale;
  const armWidth = clamp(stemWidth * 0.26, 2.8 * sproutScale, 4.2 * sproutScale);
  const legWidth = clamp(stemWidth * 0.38, 4.2 * sproutScale, 6.5 * sproutScale);
  const hookWidth = stemWidth * 0.92;
  const handSize = clamp(minDim * 0.01, 5, 9) * sproutScale;
  const bodyLength = stemHeight + legLength + topBeanRy * 1.6;
  const maxHalfWidth = Math.max(
    hookTipX + topBeanRx * 1.45,
    sideBeanOffsetX + sideBeanRx * 1.35,
    armLength + handSize + stemWidth * 0.4,
    legSpread + footSize + stemWidth * 0.22
  );

  return {
    stemHeight,
    stemWidth,
    bodyCurve,
    hookTipX,
    hookTipY,
    hookWidth,
    topBeanX,
    topBeanY,
    topBeanRx,
    topBeanRy,
    sideBeanOffsetX,
    sideBeanOffsetY,
    sideBeanRx,
    sideBeanRy,
    armLength,
    leftArmLength,
    armWidth,
    handSize,
    legLength,
    legSpread,
    legWidth,
    footSize,
    hopStride: clamp(minDim * 0.085, 28, 60) * sproutScale,
    minHopStride: clamp(minDim * 0.038, 14, 26) * sproutScale,
    hopHeight: clamp(minDim * 0.09, 24, 54) * sproutScale,
    hopHeightVariance: clamp(minDim * 0.022, 6, 14) * sproutScale,
    minHopDuration: 0.34,
    maxHopDuration: 0.58,
    landingBobAmplitude: clamp(minDim * 0.012, 3.5, 9) * sproutScale,
    idleBobAmplitude: clamp(minDim * 0.003, 0.8, 2.4) * sproutScale,
    targetThreshold: clamp(minDim * 0.08, 24, 52) * sproutScale,
    bodyLength,
    maxHalfWidth,
    motionInsets: {
      left: maxHalfWidth * 1.02,
      right: maxHalfWidth * 1.02,
      top: stemHeight + topBeanRy * 1.45,
      bottom: legLength + footSize * 1.1,
    },
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
  const outerMarginX = clamp(W * 0.03, 12, 32);
  const outerMarginTop = clamp(H * 0.07, 52, 82);
  const outerMarginBottom = clamp(H * 0.032, 12, 30);
  const targetAspect = A4_ASPECT_RATIO;
  const isPortrait = H > W || W < 900;
  const availableHeight = Math.max(260, H - outerMarginTop - outerMarginBottom);

  let width;
  let height;

  if (isPortrait) {
    const maxWidth = Math.max(220, W - outerMarginX * 2);
    const preferredWidth = Math.max(Math.min(320, maxWidth), W * 0.93);
    width = Math.min(maxWidth, preferredWidth);
    height = Math.min(availableHeight, width / targetAspect);
  } else {
    height = Math.min(availableHeight, H * 0.88);
    width = Math.min(W - outerMarginX * 2, height * targetAspect);
    const minPreferredWidth = Math.min(340, W - outerMarginX * 2);
    if (width < minPreferredWidth) {
      width = minPreferredWidth;
      height = Math.min(availableHeight, width / targetAspect);
    }
  }

  width = Math.min(width, W - outerMarginX * 2);
  height = Math.min(height, availableHeight);

  const x = (W - width) * 0.5;
  const y = outerMarginTop + (availableHeight - height) * 0.5;
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
  const outlinePoints = createParchmentOutline(panelRect);
  const fontSize = clamp(settings.fontSizePx, MIN_FONT_SIZE, MAX_FONT_SIZE);
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
  const sproutMetrics = createSproutMetrics(panelRect);
  const activeMetrics = selectedCharacter === 'sprout' ? sproutMetrics : fishMetrics;
  const blockedSlots = estimateBlockedSlots(activeMetrics, cellWidth, lineHeight);
  const spareSlots = Math.max(12, Math.round(slots.length * 0.06));
  const visibleTarget = Math.min(TARGET_VISIBLE_CHARS, Math.max(120, slots.length - blockedSlots - spareSlots));
  const textContent = buildSourceLines(bookTextSource, visibleTarget);
  const rowCenters = Array.from({ length: rows }, (_, row) => offsetY + row * lineHeight + lineHeight * 0.5);

  return {
    ...panelRect,
    outlinePoints,
    fontSize,
    lineHeight,
    cellWidth,
    cols,
    rows,
    slots,
    rowCenters,
    fishMetrics,
    sproutMetrics,
    activeMetrics,
    blockedSlots,
    spareSlots,
    textClearance: getTextClearance(cellWidth, lineHeight),
    visibleTarget,
    textLines: textContent.lines,
    textGlyphCount: textContent.glyphCount,
  };
}

function getMotionBounds(layout) {
  const metrics = layout.activeMetrics;
  const motionInsets = metrics.motionInsets || {
    left: (metrics.headLength || metrics.bodyLength * 0.2) * 0.72,
    right: (metrics.headLength || metrics.bodyLength * 0.2) * 0.72,
    top: metrics.maxHalfWidth * 1.35,
    bottom: metrics.maxHalfWidth * 1.35,
  };
  return {
    minX: layout.innerX + motionInsets.left + layout.textClearance * 0.55,
    maxX: layout.innerX + layout.innerWidth - motionInsets.right - layout.textClearance * 0.55,
    minY: layout.innerY + motionInsets.top + layout.textClearance * 0.35,
    maxY: layout.innerY + layout.innerHeight - motionInsets.bottom - layout.textClearance * 0.35,
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
    context.shadowColor = 'rgba(24, 20, 36, 0.14)';
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
    context.strokeStyle = 'rgba(200, 210, 240, 0.16)';
    context.lineWidth = 1;
    context.stroke();
  }
}

class BeanSproutFairy {
  constructor(metrics, bounds) {
    this.metrics = metrics;
    this.bounds = bounds;
    this.x = randomBetween(bounds.minX, bounds.maxX);
    this.y = randomBetween(bounds.minY, bounds.maxY);
    this.displayY = this.y;
    this.rotation = 0;
    this.bobOffset = 0;
    this.walkPhase = Math.random() * Math.PI * 2;
    this.facing = Math.random() < 0.5 ? -1 : 1;
    this.hopElapsed = 0;
    this.hopDuration = metrics.minHopDuration;
    this.hopHeight = metrics.hopHeight;
    this.hopStartX = this.x;
    this.hopStartY = this.y;
    this.hopEndX = this.x;
    this.hopEndY = this.y;
    this.hopProgress = 0;
    this.pickTarget(true);
    this.startHop(true);
  }

  pickTarget(forceWide = false) {
    const insetX = forceWide ? 0 : (this.bounds.maxX - this.bounds.minX) * 0.08;
    const insetY = forceWide ? 0 : (this.bounds.maxY - this.bounds.minY) * 0.12;
    this.targetX = randomBetween(this.bounds.minX + insetX, this.bounds.maxX - insetX);
    this.targetY = randomBetween(this.bounds.minY + insetY, this.bounds.maxY - insetY);
  }

  toLocalPoint(px, py) {
    const dx = px - this.x;
    const dy = py - this.displayY;
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    return {
      x: (dx * cos + dy * sin) * this.facing,
      y: -dx * sin + dy * cos,
    };
  }

  startHop(forceInitial = false) {
    const m = this.metrics;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distanceToTarget = Math.hypot(dx, dy);

    if (!forceInitial && distanceToTarget < m.targetThreshold) {
      this.pickTarget();
    }

    const nextDx = this.targetX - this.x;
    const nextDy = this.targetY - this.y;
    const nextDistance = Math.hypot(nextDx, nextDy) || 1;
    const dirX = nextDx / nextDistance;
    const dirY = nextDy / nextDistance;
    const stride = clamp(
      nextDistance * randomBetween(0.28, 0.42),
      m.minHopStride,
      m.hopStride
    );

    this.hopStartX = this.x;
    this.hopStartY = this.y;
    this.hopEndX = clamp(this.x + dirX * stride, this.bounds.minX, this.bounds.maxX);
    this.hopEndY = clamp(this.y + dirY * stride * 0.75, this.bounds.minY, this.bounds.maxY);
    this.hopElapsed = 0;
    this.hopDuration = randomBetween(m.minHopDuration, m.maxHopDuration);
    this.hopHeight = clamp(
      m.hopHeight + randomBetween(-m.hopHeightVariance, m.hopHeightVariance) + stride * 0.16,
      m.hopHeight * 0.72,
      m.hopHeight * 1.45
    );
    this.hopProgress = 0;

    if (Math.abs(this.hopEndX - this.x) > 1.5) {
      this.facing = this.hopEndX >= this.x ? 1 : -1;
    }
  }

  update(dt, timestamp) {
    const m = this.metrics;
    this.hopElapsed += dt;
    const progress = clamp(this.hopElapsed / this.hopDuration, 0, 1);
    this.hopProgress = progress;
    const travel = 1 - Math.pow(1 - progress, 2);

    this.x = lerp(this.hopStartX, this.hopEndX, travel);
    this.y = lerp(this.hopStartY, this.hopEndY, travel);

    const hopLift = Math.sin(progress * Math.PI) * this.hopHeight;
    const touchdownPulse = Math.max(0, 1 - Math.abs(progress - 0.96) / 0.1);
    const launchPulse = Math.max(0, 1 - Math.abs(progress - 0.08) / 0.1);
    this.walkPhase += dt * lerp(7.5, 11.5, hopLift / Math.max(1, this.hopHeight));

    const bobTarget =
      -hopLift +
      Math.sin(timestamp * 0.0016 + this.walkPhase * 0.18) * m.idleBobAmplitude +
      Math.sin(progress * Math.PI * 2) * m.landingBobAmplitude * 0.12 -
      touchdownPulse * m.landingBobAmplitude * 0.2 +
      launchPulse * m.landingBobAmplitude * 0.08;
    this.bobOffset += (bobTarget - this.bobOffset) * (1 - Math.exp(-dt * 11));
    this.displayY = clamp(this.y + this.bobOffset, this.bounds.minY, this.bounds.maxY + m.footSize);

    const arcTilt = Math.sin(progress * Math.PI) * 0.045 * this.facing;
    const targetRotation = clamp((this.hopEndX - this.hopStartX) / Math.max(1, m.hopStride) * 0.06, -0.06, 0.06) + arcTilt;
    this.rotation += (targetRotation - this.rotation) * (1 - Math.exp(-dt * 5.5));

    if (progress >= 1) {
      this.x = this.hopEndX;
      this.y = this.hopEndY;
      this.startHop();
    }
  }

  contains(px, py, padding = 0) {
    const m = this.metrics;
    const local = this.toLocalPoint(px, py);
    const bodyTopY = -m.stemHeight;
    const bodyRadius = m.stemWidth * 0.5 + padding;

    if (pointToSegmentDistance(local.x, local.y, 0, bodyTopY * 0.92, 0, 0) <= bodyRadius) {
      return true;
    }

    if (pointToSegmentDistance(local.x, local.y, 0, bodyTopY, m.hookTipX, m.hookTipY) <= m.hookWidth * 0.5 + padding) {
      return true;
    }

    if (((local.x - m.topBeanX) ** 2) / ((m.topBeanRx + padding) ** 2) + ((local.y - m.topBeanY) ** 2) / ((m.topBeanRy + padding) ** 2) <= 1) {
      return true;
    }

    const podCenterX = -m.sideBeanOffsetX;
    const podCenterY = -m.sideBeanOffsetY;
    if (((local.x - podCenterX) ** 2) / ((m.sideBeanRx + padding) ** 2) + ((local.y - podCenterY) ** 2) / ((m.sideBeanRy + padding) ** 2) <= 1) {
      return true;
    }

    return false;
  }

  draw(context) {
    context.save();
    context.translate(this.x, this.displayY);
    context.rotate(this.rotation);
    context.scale(this.facing, 1);
    drawSproutFairyFigure(context, this.metrics, { walkPhase: this.walkPhase });
    context.restore();
  }
}

function createCharacter(type, panelLayout, bounds) {
  if (type === 'sprout') {
    return new BeanSproutFairy(panelLayout.sproutMetrics || createSproutMetrics(panelLayout), bounds);
  }
  return new SegmentedFish(panelLayout.fishMetrics, bounds);
}

function rebuildScene() {
  resizeCanvas();
  panel = buildPanel();
  motionBounds = getMotionBounds(panel);
  backdropTexture = createBackdropTexture(W, H);
  paperTexture = createPaperTexture(panel.width, panel.height);
  character = createCharacter(selectedCharacter, panel, motionBounds);
  syncBackButtonPosition();
  flowTargets = [];
  lastTextFlowUpdate = 0;
  updateTextFlow(performance.now(), true);
  charEl.textContent = `${panel.textGlyphCount} chars`;
}

function renderIntroFrame() {
  if (!panel || !character) {
    return;
  }

  drawBackground();
  drawPanel();
  drawText();
  character.draw(ctx);
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
  ctx.fillStyle = SCENE_BACKGROUND_COLOR;
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
  parchmentPath(ctx, panel);
  ctx.fillStyle = settings.paperColor;
  ctx.fill();
  ctx.restore();

  ctx.save();
  parchmentPath(ctx, panel);
  ctx.clip();

  if (paperTexture) {
    ctx.drawImage(paperTexture, panel.x, panel.y, panel.width, panel.height);
  }

  const wash = ctx.createLinearGradient(panel.x, panel.y, panel.x, panel.y + panel.height);
  wash.addColorStop(0, 'rgba(248, 244, 238, 0.2)');
  wash.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  wash.addColorStop(1, 'rgba(100, 80, 90, 0.06)');
  ctx.fillStyle = wash;
  ctx.fillRect(panel.x, panel.y, panel.width, panel.height);
  ctx.restore();

  ctx.save();
  parchmentPath(ctx, panel);
  ctx.strokeStyle = PANEL_BORDER;
  ctx.lineWidth = 1.3;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();

  ctx.save();
  parchmentPath(ctx, panel);
  ctx.strokeStyle = 'rgba(248, 240, 232, 0.26)';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([1.2, 6]);
  ctx.lineDashOffset = 2;
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
  if (!panel || !character) {
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
      if (!character.contains(slot.x, slot.y, panel.textClearance)) {
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
  if (!panel || !character) {
    return;
  }

  if (!force && timestamp - lastTextFlowUpdate < settings.textFlowIntervalMs) {
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

  ctx.fillStyle = settings.textColor;
  ctx.font = createFont(panel.fontSize);

  for (const slot of flowTargets) {
    ctx.fillText(slot.char, slot.x, slot.y);
  }
}

function loop(timestamp) {
  animationFrameId = window.requestAnimationFrame(loop);

  if (!sceneReady || !panel || !character) {
    return;
  }

  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  updateFps(dt);
  character.update(dt, timestamp);
  updateTextFlow(timestamp);
  drawBackground();
  drawPanel();
  drawText();
  character.draw(ctx);
}

function syncModalState() {
  const isOpen = !textModalEl.hidden || !configModalEl.hidden;
  document.body.classList.toggle('is-modal-open', isOpen);
}

function syncBackButtonPosition() {
  if (!panel) {
    return;
  }

  const rect = backButtonEl.getBoundingClientRect();
  const buttonWidth = rect.width || 104;
  const buttonHeight = rect.height || 42;
  const gap = clamp(Math.min(panel.width, panel.height) * 0.018, 10, 18);
  const left = clamp(panel.x + panel.width + gap * 0.55, 12, W - buttonWidth - 12);
  const top = clamp(panel.y + panel.height - buttonHeight * 0.34, 12, H - buttonHeight - 12);

  backButtonEl.style.left = `${Math.round(left)}px`;
  backButtonEl.style.top = `${Math.round(top)}px`;
}

function stopAnimationLoop() {
  if (!animationFrameId) {
    return;
  }

  window.cancelAnimationFrame(animationFrameId);
  animationFrameId = 0;
}

function setInputModalOpen(isOpen, options = {}) {
  const { restoreFocus = true } = options;

  if (isOpen) {
    setConfigModalOpen(false, { restoreFocus: false });
  }

  textModalEl.hidden = !isOpen;
  toggleInputButton.setAttribute('aria-expanded', String(isOpen));
  syncModalState();

  if (isOpen) {
    textInputEl.focus();
    const cursor = textInputEl.value.length;
    textInputEl.setSelectionRange(cursor, cursor);
  } else if (restoreFocus) {
    toggleInputButton.focus();
  }
}

function setConfigModalOpen(isOpen, options = {}) {
  const { restoreFocus = true } = options;

  if (isOpen) {
    setInputModalOpen(false, { restoreFocus: false });
    populateConfigForm(settings);
  }

  configModalEl.hidden = !isOpen;
  toggleConfigButton.setAttribute('aria-expanded', String(isOpen));
  syncModalState();

  if (isOpen) {
    fontSizeInputEl.focus();
  } else if (restoreFocus) {
    toggleConfigButton.focus();
  }
}

async function ensureFontLoaded(fontKey = settings.fontFamily) {
  if (!document.fonts || !document.fonts.load) {
    return;
  }

  const fontOption = getFontOption(fontKey);
  const timeout = new Promise((resolve) => {
    window.setTimeout(resolve, FONT_LOAD_TIMEOUT_MS);
  });

  await Promise.race([
    Promise.all([
      document.fonts.load(`300 20px "${fontOption.loadName}"`),
      document.fonts.ready,
    ]),
    timeout,
  ]);
}

function refreshScene() {
  rebuildScene();
  if (!sceneReady) {
    renderIntroFrame();
    return;
  }
  lastTime = performance.now();
}

async function applyConfigSettings() {
  const nextSettings = readConfigForm();
  settings = nextSettings;
  saveSettings(settings);
  syncCssSettings();
  await ensureFontLoaded(settings.fontFamily);
  refreshScene();
  setConfigModalOpen(false);
}

function startExperience() {
  if (!appInitialized || experienceStarted) {
    return;
  }

  experienceStarted = true;
  setInputModalOpen(false, { restoreFocus: false });
  setConfigModalOpen(false, { restoreFocus: false });
  const checkedRadio = document.querySelector('input[name="character"]:checked');
  selectedCharacter = checkedRadio ? checkedRadio.value : 'fish';
  bookTextSource = normalizeSourceText(textInputEl.value);
  rebuildScene();
  sceneReady = true;
  startScreenEl.classList.add('is-hidden');
  document.body.classList.add('is-running');
  lastTime = performance.now();
  if (!animationFrameId) {
    animationFrameId = window.requestAnimationFrame(loop);
  }
}

function returnToStartScreen() {
  stopAnimationLoop();
  experienceStarted = false;
  sceneReady = false;
  frameCount = 0;
  fpsAccum = 0;
  fpsEl.textContent = '0 FPS';
  setInputModalOpen(false, { restoreFocus: false });
  setConfigModalOpen(false, { restoreFocus: false });
  document.body.classList.remove('is-running');
  startScreenEl.classList.remove('is-hidden');
  const checkedRadio = document.querySelector('input[name="character"]:checked');
  selectedCharacter = checkedRadio ? checkedRadio.value : selectedCharacter;
  bookTextSource = normalizeSourceText(textInputEl.value);
  rebuildScene();
  renderIntroFrame();
  startButton.focus();
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

window.addEventListener('resize', scheduleRebuild);
backButtonEl.addEventListener('click', returnToStartScreen);
toggleInputButton.addEventListener('click', () => {
  setInputModalOpen(true);
});
toggleConfigButton.addEventListener('click', () => {
  setConfigModalOpen(true);
});
closeInputButton.addEventListener('click', () => {
  setInputModalOpen(false);
});
applyInputButton.addEventListener('click', () => {
  setInputModalOpen(false);
});
closeConfigButton.addEventListener('click', () => {
  setConfigModalOpen(false);
});
cancelConfigButton.addEventListener('click', () => {
  setConfigModalOpen(false);
});
resetConfigButton.addEventListener('click', () => {
  populateConfigForm(DEFAULT_SETTINGS);
});
applyConfigButton.addEventListener('click', async () => {
  await applyConfigSettings();
});
textModalEl.addEventListener('click', (event) => {
  if (event.target.hasAttribute('data-close-input-modal')) {
    setInputModalOpen(false);
  }
});
configModalEl.addEventListener('click', (event) => {
  if (event.target.hasAttribute('data-close-config-modal')) {
    setConfigModalOpen(false);
  }
});
startButton.addEventListener('click', startExperience);
textModalEl.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    setInputModalOpen(false);
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    startExperience();
  }
});
configModalEl.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    setConfigModalOpen(false);
  }
});
configFormEl.addEventListener('submit', (event) => {
  event.preventDefault();
});
fontSizeInputEl.addEventListener('input', updateConfigValueLabels);
textColorInputEl.addEventListener('input', updateConfigValueLabels);
textIntervalInputEl.addEventListener('input', updateConfigValueLabels);
paperColorInputEl.addEventListener('input', updateConfigValueLabels);
document.querySelectorAll('input[name="character"]').forEach((radio) => {
  radio.addEventListener('change', (event) => {
    if (experienceStarted || !event.target.checked) {
      return;
    }
    selectedCharacter = event.target.value;
    refreshScene();
  });
});

function drawCharacterPreviews() {
  document.querySelectorAll('.character-preview').forEach((cvs) => {
    const previewCtx = cvs.getContext('2d');
    const w = cvs.width;
    const h = cvs.height;
    const type = cvs.dataset.character;

    previewCtx.clearRect(0, 0, w, h);

    if (type === 'fish') {
      previewCtx.save();
      previewCtx.translate(w * 0.5, h * 0.5);
      previewCtx.scale(0.55, 0.55);

      previewCtx.beginPath();
      previewCtx.moveTo(50, 0);
      previewCtx.quadraticCurveTo(30, -22, -10, -18);
      previewCtx.quadraticCurveTo(-30, -16, -45, -8);
      previewCtx.lineTo(-62, -18);
      previewCtx.lineTo(-55, 0);
      previewCtx.lineTo(-62, 18);
      previewCtx.lineTo(-45, 8);
      previewCtx.quadraticCurveTo(-30, 16, -10, 18);
      previewCtx.quadraticCurveTo(30, 22, 50, 0);
      previewCtx.closePath();
      previewCtx.fillStyle = FISH_FILL;
      previewCtx.fill();
      previewCtx.strokeStyle = FISH_STROKE;
      previewCtx.lineWidth = 1.5;
      previewCtx.stroke();

      previewCtx.beginPath();
      previewCtx.moveTo(-5, -16);
      previewCtx.quadraticCurveTo(-15, -28, -30, -22);
      previewCtx.strokeStyle = FISH_ACCENT;
      previewCtx.lineWidth = 2;
      previewCtx.stroke();

      previewCtx.beginPath();
      previewCtx.arc(32, -4, 3, 0, Math.PI * 2);
      previewCtx.fillStyle = FISH_EYE;
      previewCtx.fill();

      previewCtx.restore();
    } else if (type === 'sprout') {
      previewCtx.save();
      previewCtx.translate(w * 0.44, h * 0.78);
      drawSproutFairyFigure(previewCtx, {
        stemHeight: 48,
        stemWidth: 8,
        bodyCurve: 1.4,
        hookTipX: 11,
        hookTipY: -40,
        hookWidth: 7.4,
        topBeanX: 18,
        topBeanY: -33,
        topBeanRx: 10,
        topBeanRy: 8.1,
        sideBeanOffsetX: 18,
        sideBeanOffsetY: 7,
        sideBeanRx: 7,
        sideBeanRy: 5.4,
        armLength: 11,
        leftArmLength: 9,
        armWidth: 1.7,
        handSize: 2.3,
        legLength: 8,
        legSpread: 3.8,
        legWidth: 2.1,
        footSize: 3.1,
      }, { walkPhase: 0.6 });
      previewCtx.restore();
    }
  });
}

(async () => {
  populateConfigForm(settings);
  syncCssSettings();
  const checkedRadio = document.querySelector('input[name="character"]:checked');
  selectedCharacter = checkedRadio ? checkedRadio.value : selectedCharacter;
  await ensureFontLoaded(settings.fontFamily);
  rebuildScene();
  renderIntroFrame();
  drawCharacterPreviews();
  startButton.disabled = false;
  appInitialized = true;
})();
