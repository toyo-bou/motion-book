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
const outlineGapInputEl = document.getElementById('outline-gap-input');
const outlineGapValueEl = document.getElementById('outline-gap-value');
const textColorInputEl = document.getElementById('text-color-input');
const textColorValueEl = document.getElementById('text-color-value');
const fontFamilyInputEl = document.getElementById('font-family-input');
const textIntervalInputEl = document.getElementById('text-interval-input');
const textIntervalValueEl = document.getElementById('text-interval-value');
const paperColorInputEl = document.getElementById('paper-color-input');
const paperColorValueEl = document.getElementById('paper-color-value');
const audioFileInputEl = document.getElementById('audio-file-input');
const audioFileNameEl = document.getElementById('audio-file-name');
const audioClearButtonEl = document.getElementById('audio-clear-button');

const FONT_SIZE_BASELINE_PX = 14;
const LEGACY_DEFAULT_FONT_SIZE_PX = 18;
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 24;
const LINE_HEIGHT_RATIO = 1.72;
const CJK_WIDTH_RATIO = 1.28;
const TARGET_VISIBLE_CHARS = 600;
const A4_ASPECT_RATIO = 1 / Math.sqrt(2);
const PARCHMENT_SCALE = 1.1;
const MIN_TEXT_FLOW_INTERVAL_MS = 50;
const MAX_TEXT_FLOW_INTERVAL_MS = 250;
const TEXT_CLEARANCE_MULTIPLIER = 1.18;
const OUTLINE_GAP_BASELINE_PERCENT = 100;
const MIN_OUTLINE_GAP_PERCENT = 80;
const MAX_OUTLINE_GAP_PERCENT = 140;
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
  fontSizePx: FONT_SIZE_BASELINE_PX,
  textOutlineGapPercent: OUTLINE_GAP_BASELINE_PERCENT,
  textColor: '#2a2130',
  fontFamily: 'kiwi-maru',
  textFlowIntervalMs: 100,
  paperColor: '#f0e6da',
});
const LEGACY_DEFAULT_SETTINGS = Object.freeze({
  ...DEFAULT_SETTINGS,
  fontSizePx: LEGACY_DEFAULT_FONT_SIZE_PX,
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
const DEVIL_SKIN = 'rgba(255, 255, 255, 0.98)';
const DEVIL_MASK = 'rgba(8, 4, 12, 0.96)';
const DEVIL_CLOTH = 'rgba(10, 8, 14, 0.94)';
const DEVIL_CLOTH_STROKE = 'rgba(4, 2, 6, 0.98)';
const DEVIL_STROKE = 'rgba(12, 8, 16, 0.97)';
const DEVIL_SHADOW = 'rgba(60, 50, 70, 0.4)';
const DEVIL_BROW = 'rgba(8, 4, 12, 0.98)';
const DEVIL_PAIR_VIEWBOX_WIDTH = 360;
const DEVIL_PAIR_VIEWBOX_HEIGHT = 300;
const DEVIL_PAIR_ASPECT = DEVIL_PAIR_VIEWBOX_WIDTH / DEVIL_PAIR_VIEWBOX_HEIGHT;
const DEVIL_PAIR_HEM_RADIUS = 42;
const DEVIL_PAIR_HEM_BLEED = 3;
const DEVIL_PAIR_HEM_CLEANUP = 2;
const DEVIL_PAIR_SPRITE_URL = new URL('./assets/devil-pair-sprite.png', import.meta.url).href;

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
let configSessionStartSettings = null;
let configPreviewToken = 0;
let particleSystem = null;
let bgmAudio = null;
let bgmObjectUrl = null;
let devilPairMeshPatternSource = null;
let devilPairSpriteImage = null;
let devilPairSpritePromise = null;

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

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function seededBetween(random, min, max) {
  return min + random() * (max - min);
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

function pointInPolygon(px, py, points) {
  let inside = false;

  for (let index = 0, prev = points.length - 1; index < points.length; prev = index, index += 1) {
    const current = points[index];
    const previous = points[prev];
    const intersects =
      ((current.y > py) !== (previous.y > py)) &&
      (px < ((previous.x - current.x) * (py - current.y)) / ((previous.y - current.y) || 1e-6) + current.x);

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
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

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });
}

async function ensureDevilPairSpriteLoaded() {
  if (devilPairSpriteImage) {
    return devilPairSpriteImage;
  }

  if (devilPairSpritePromise) {
    return devilPairSpritePromise;
  }

  devilPairSpritePromise = (async () => {
    try {
      devilPairSpriteImage = await loadImage(DEVIL_PAIR_SPRITE_URL);
      return devilPairSpriteImage;
    } catch (error) {
      console.warn('Failed to load devil sprite image.', error);
      return null;
    } finally {
      devilPairSpritePromise = null;
    }
  })();

  return devilPairSpritePromise;
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

function getDevilFigureLayout(metrics, breathPhase = 0) {
  const breath = Math.sin(breathPhase) * 0.03;
  const torsoHeight = metrics.torsoHeight * (1 + breath * 0.65);
  const torsoHalfTop = metrics.torsoWidth * (1 + breath * 0.28);
  const torsoHalfBottom = torsoHalfTop * 1.14;
  const torsoTopY = -torsoHeight * 0.56;
  const torsoBottomY = torsoHeight * 0.62;
  const shoulderY = torsoTopY + torsoHeight * 0.12;
  const neckTopY = torsoTopY - metrics.neckHeight;
  const headCenterY = neckTopY - metrics.headRy * 0.84;

  return {
    torsoHeight,
    torsoHalfTop,
    torsoHalfBottom,
    torsoTopY,
    torsoBottomY,
    shoulderY,
    neckTopY,
    headCenterY,
    leftShoulder: {
      x: -metrics.shoulderWidth,
      y: shoulderY,
    },
    rightShoulder: {
      x: metrics.shoulderWidth,
      y: shoulderY,
    },
    leftHand: {
      x: -metrics.shoulderWidth * 0.45,
      y: torsoTopY + torsoHeight * 0.28,
    },
    rightHand: {
      x: metrics.shoulderWidth * 0.45,
      y: torsoTopY + torsoHeight * 0.32,
    },
  };
}

function drawDevilHand(context, x, y, handSize, fingerLength, direction = 1) {
  const palmWidth = handSize * 0.9;
  const palmHeight = handSize * 1.08;

  context.save();
  context.translate(x, y);
  context.rotate(direction * -0.16);
  context.fillStyle = DEVIL_SKIN;
  context.strokeStyle = DEVIL_STROKE;
  context.lineWidth = Math.max(1, palmWidth * 0.14);
  context.lineJoin = 'round';
  context.lineCap = 'round';

  context.beginPath();
  context.moveTo(-palmWidth * 0.42, palmHeight * 0.34);
  context.quadraticCurveTo(-palmWidth * 0.72, -palmHeight * 0.04, -palmWidth * 0.2, -palmHeight * 0.62);
  context.quadraticCurveTo(palmWidth * 0.22, -palmHeight * 0.76, palmWidth * 0.52, -palmHeight * 0.16);
  context.quadraticCurveTo(palmWidth * 0.7, palmHeight * 0.22, palmWidth * 0.18, palmHeight * 0.56);
  context.closePath();
  context.fill();
  context.stroke();

  const fingerLineWidth = Math.max(0.8, palmWidth * 0.11);
  const fingerBases = [-0.34, -0.12, 0.1, 0.32];
  context.lineWidth = fingerLineWidth;
  for (let index = 0; index < fingerBases.length; index += 1) {
    const baseX = fingerBases[index] * palmWidth;
    const lift = palmHeight * (0.62 + index * 0.08);
    const tipX = baseX + direction * fingerLength * (0.68 + index * 0.04);
    const tipY = -lift;
    context.beginPath();
    context.moveTo(baseX, -palmHeight * 0.28);
    context.quadraticCurveTo(
      baseX + direction * fingerLength * 0.24,
      -palmHeight * 0.84 - index * 0.4,
      tipX,
      tipY
    );
    context.stroke();
  }

  context.beginPath();
  context.moveTo(direction * palmWidth * 0.04, palmHeight * 0.06);
  context.quadraticCurveTo(
    direction * fingerLength * 0.18,
    palmHeight * 0.34,
    direction * fingerLength * 0.44,
    palmHeight * 0.16
  );
  context.stroke();
  context.restore();
}

function drawDevilTorso(context, m, layout) {
  context.beginPath();
  context.moveTo(-layout.torsoHalfTop, layout.torsoTopY);
  context.lineTo(layout.torsoHalfTop, layout.torsoTopY);
  context.lineTo(layout.torsoHalfBottom, layout.torsoBottomY);
  context.lineTo(-layout.torsoHalfBottom, layout.torsoBottomY);
  context.closePath();
  context.fillStyle = DEVIL_CLOTH;
  context.fill();
  context.strokeStyle = DEVIL_CLOTH_STROKE;
  context.lineWidth = Math.max(2, m.armWidth * 0.22);
  context.lineJoin = 'round';
  context.stroke();
}

function drawDevilNeckAndVest(context, m, layout) {
  const vNeckY = layout.torsoTopY + layout.torsoHeight * 0.27;
  context.beginPath();
  context.moveTo(-m.neckWidth * 1.2, layout.torsoTopY + 1);
  context.lineTo(0, vNeckY);
  context.lineTo(m.neckWidth * 1.2, layout.torsoTopY + 1);
  context.closePath();
  context.fillStyle = DEVIL_SKIN;
  context.fill();

  context.beginPath();
  context.moveTo(-m.neckWidth * 0.44, layout.torsoTopY);
  context.lineTo(m.neckWidth * 0.44, layout.torsoTopY);
  context.lineTo(m.neckWidth * 0.28, layout.neckTopY);
  context.lineTo(-m.neckWidth * 0.28, layout.neckTopY);
  context.closePath();
  context.fillStyle = DEVIL_SKIN;
  context.fill();
  context.strokeStyle = DEVIL_STROKE;
  context.lineWidth = 1.1;
  context.stroke();
}

function drawDevilArms(context, m, layout) {
  const armOuterWidth = m.armWidth + Math.max(3.5, m.armWidth * 0.34);

  strokeOutlinedPath(context, armOuterWidth, m.armWidth, DEVIL_CLOTH_STROKE, DEVIL_CLOTH, (ctxRef) => {
    ctxRef.moveTo(layout.leftShoulder.x, layout.leftShoulder.y);
    ctxRef.quadraticCurveTo(
      -m.armWidth * 0.1,
      layout.torsoTopY + layout.torsoHeight * 0.22,
      layout.rightHand.x,
      layout.rightHand.y
    );
  });

  strokeOutlinedPath(context, armOuterWidth, m.armWidth, DEVIL_CLOTH_STROKE, DEVIL_CLOTH, (ctxRef) => {
    ctxRef.moveTo(layout.rightShoulder.x, layout.rightShoulder.y);
    ctxRef.quadraticCurveTo(
      m.armWidth * 0.1,
      layout.torsoTopY + layout.torsoHeight * 0.18,
      layout.leftHand.x,
      layout.leftHand.y
    );
  });

  drawDevilHand(context, layout.leftHand.x, layout.leftHand.y, m.handSize, m.fingerLength, -1);
  drawDevilHand(context, layout.rightHand.x, layout.rightHand.y, m.handSize, m.fingerLength, 1);
}

function drawDevilHead(context, m, layout) {
  context.beginPath();
  context.ellipse(0, layout.headCenterY, m.headRx, m.headRy, 0, 0, Math.PI * 2);
  context.fillStyle = DEVIL_SKIN;
  context.fill();
  context.strokeStyle = DEVIL_STROKE;
  context.lineWidth = Math.max(1.8, m.browThickness * 0.45);
  context.stroke();

  context.save();
  context.beginPath();
  context.ellipse(0, layout.headCenterY, m.headRx * 0.98, m.headRy * 0.98, 0, 0, Math.PI * 2);
  context.clip();

  const cheekShadow = context.createLinearGradient(
    -m.headRx * 0.2,
    layout.headCenterY - m.headRy * 0.1,
    m.headRx * 1.1,
    layout.headCenterY + m.headRy * 0.46
  );
  cheekShadow.addColorStop(0, 'rgba(60, 50, 70, 0)');
  cheekShadow.addColorStop(0.44, 'rgba(60, 50, 70, 0.03)');
  cheekShadow.addColorStop(1, DEVIL_SHADOW);
  context.fillStyle = cheekShadow;
  context.beginPath();
  context.moveTo(m.headRx * 0.06, layout.headCenterY - m.headRy * 1.05);
  context.quadraticCurveTo(m.headRx * 0.84, layout.headCenterY - m.headRy * 0.8, m.headRx * 0.9, layout.headCenterY - m.headRy * 0.12);
  context.quadraticCurveTo(m.headRx * 0.94, layout.headCenterY + m.headRy * 0.74, m.headRx * 0.18, layout.headCenterY + m.headRy * 1.02);
  context.quadraticCurveTo(m.headRx * 0.04, layout.headCenterY + m.headRy * 0.5, m.headRx * 0.16, layout.headCenterY - m.headRy * 0.16);
  context.closePath();
  context.fill();

  const jawShadow = context.createLinearGradient(
    -m.headRx * 0.18,
    layout.headCenterY + m.headRy * 0.18,
    m.headRx * 0.68,
    layout.headCenterY + m.headRy * 0.92
  );
  jawShadow.addColorStop(0, 'rgba(60, 50, 70, 0)');
  jawShadow.addColorStop(1, 'rgba(60, 50, 70, 0.08)');
  context.fillStyle = jawShadow;
  context.beginPath();
  context.moveTo(-m.headRx * 0.12, layout.headCenterY + m.headRy * 0.42);
  context.quadraticCurveTo(m.headRx * 0.12, layout.headCenterY + m.headRy * 0.9, m.headRx * 0.42, layout.headCenterY + m.headRy * 0.84);
  context.quadraticCurveTo(m.headRx * 0.22, layout.headCenterY + m.headRy * 0.56, -m.headRx * 0.04, layout.headCenterY + m.headRy * 0.5);
  context.closePath();
  context.fill();
  context.restore();

  const hairTopY = layout.headCenterY - m.headRy - m.hairHeight * 0.54;
  context.beginPath();
  context.moveTo(-m.headRx * 0.94, layout.headCenterY - m.headRy * 0.24);
  context.quadraticCurveTo(-m.headRx * 1.12, layout.headCenterY - m.headRy * 0.98, -m.headRx * 0.48, hairTopY);
  context.quadraticCurveTo(-m.headRx * 0.06, hairTopY - m.hairHeight * 0.1, m.headRx * 0.24, layout.headCenterY - m.headRy - m.hairHeight * 0.34);
  context.quadraticCurveTo(m.headRx * 0.78, layout.headCenterY - m.headRy * 0.96, m.headRx * 0.92, layout.headCenterY - m.headRy * 0.08);
  context.lineTo(m.headRx * 0.64, layout.headCenterY - m.headRy * 0.02);
  context.quadraticCurveTo(m.headRx * 0.46, layout.headCenterY - m.headRy * 0.5, m.headRx * 0.08, layout.headCenterY - m.headRy * 0.56);
  context.quadraticCurveTo(-m.headRx * 0.22, layout.headCenterY - m.headRy * 0.64, -m.headRx * 0.52, layout.headCenterY - m.headRy * 0.36);
  context.lineTo(-m.headRx * 0.82, layout.headCenterY - m.headRy * 0.04);
  context.closePath();
  context.fillStyle = DEVIL_CLOTH_STROKE;
  context.fill();

  context.strokeStyle = 'rgba(240, 240, 242, 0.26)';
  context.lineWidth = Math.max(1, m.browThickness * 0.22);
  context.beginPath();
  context.moveTo(-m.headRx * 0.2, hairTopY + m.hairHeight * 0.24);
  context.quadraticCurveTo(-m.headRx * 0.02, hairTopY - m.hairHeight * 0.08, m.headRx * 0.16, hairTopY + m.hairHeight * 0.12);
  context.stroke();
  context.beginPath();
  context.moveTo(m.headRx * 0.28, layout.headCenterY - m.headRy * 0.86);
  context.quadraticCurveTo(m.headRx * 0.5, layout.headCenterY - m.headRy * 1.02, m.headRx * 0.62, layout.headCenterY - m.headRy * 0.62);
  context.stroke();
}

function drawDevilFace(context, m, layout) {
  const leftEyeX = -m.eyeOffsetX;
  const leftEyeY = layout.headCenterY + m.eyeOffsetY;
  const rightEyeX = m.eyeOffsetX * 0.96;
  const rightEyeY = layout.headCenterY + m.eyeOffsetY * 0.94;

  context.beginPath();
  context.ellipse(leftEyeX, leftEyeY, m.eyeMaskRx, m.eyeMaskRy, -0.18, 0, Math.PI * 2);
  context.fillStyle = DEVIL_MASK;
  context.fill();

  context.beginPath();
  context.moveTo(rightEyeX - m.eyeMaskRx2 * 0.96, rightEyeY - m.eyeMaskRy2 * 0.24);
  context.quadraticCurveTo(rightEyeX - m.eyeMaskRx2 * 0.46, rightEyeY - m.eyeMaskRy2 * 1.02, rightEyeX + m.eyeMaskRx2 * 0.58, rightEyeY - m.eyeMaskRy2 * 0.66);
  context.quadraticCurveTo(rightEyeX + m.eyeMaskRx2 * 1.08, rightEyeY - m.eyeMaskRy2 * 0.08, rightEyeX + m.eyeMaskRx2 * 0.8, rightEyeY + m.eyeMaskRy2 * 0.72);
  context.quadraticCurveTo(rightEyeX + m.eyeMaskRx2 * 0.08, rightEyeY + m.eyeMaskRy2 * 0.98, rightEyeX - m.eyeMaskRx2 * 0.3, rightEyeY + m.eyeMaskRy2 * 0.34);
  context.quadraticCurveTo(rightEyeX - m.eyeMaskRx2 * 0.74, rightEyeY + m.eyeMaskRy2 * 0.08, rightEyeX - m.eyeMaskRx2 * 0.96, rightEyeY - m.eyeMaskRy2 * 0.24);
  context.closePath();
  context.fill();

  context.fillStyle = 'rgba(236, 234, 232, 0.9)';
  context.beginPath();
  context.ellipse(leftEyeX, leftEyeY + m.eyeMaskRy * 0.04, m.eyeMaskRx * 0.48, m.eyeMaskRy * 0.24, -0.12, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.ellipse(rightEyeX, rightEyeY + m.eyeMaskRy2 * 0.04, m.eyeMaskRx2 * 0.4, m.eyeMaskRy2 * 0.22, -0.08, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = DEVIL_BROW;
  context.beginPath();
  context.arc(leftEyeX + m.eyeMaskRx * 0.06, leftEyeY - m.eyeMaskRy * 0.1, m.eyeSize, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(rightEyeX, rightEyeY - m.eyeMaskRy2 * 0.06, m.eyeSize, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = DEVIL_BROW;
  context.lineWidth = m.browThickness;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(leftEyeX - m.browWidth * 0.58, leftEyeY - m.eyeMaskRy * 1.32);
  context.quadraticCurveTo(leftEyeX - m.browWidth * 0.08, leftEyeY - m.eyeMaskRy * 1.72, leftEyeX + m.browWidth * 0.54, leftEyeY - m.eyeMaskRy * 1.18);
  context.stroke();
  context.beginPath();
  context.moveTo(rightEyeX - m.browWidth * 0.54, rightEyeY - m.eyeMaskRy2 * 1.28);
  context.quadraticCurveTo(rightEyeX + m.browWidth * 0.12, rightEyeY - m.eyeMaskRy2 * 1.64, rightEyeX + m.browWidth * 0.6, rightEyeY - m.eyeMaskRy2 * 1.1);
  context.stroke();

  context.strokeStyle = DEVIL_STROKE;
  context.lineWidth = Math.max(1, m.browThickness * 0.3);
  context.beginPath();
  context.moveTo(-m.neckWidth * 0.18, layout.headCenterY + m.headRy * 0.52);
  context.quadraticCurveTo(0, layout.headCenterY + m.headRy * 0.72, m.neckWidth * 0.24, layout.headCenterY + m.headRy * 0.58);
  context.stroke();
}

function drawDevilFigure(context, metrics, pose = {}) {
  const m = metrics;
  const alpha = pose.alpha ?? 1;
  const breathPhase = pose.breathPhase || 0;
  const layout = getDevilFigureLayout(m, breathPhase);

  context.save();
  context.globalAlpha = alpha;
  context.shadowColor = 'rgba(8, 8, 14, 0.18)';
  context.shadowBlur = Math.max(4, m.armWidth * 0.55);
  drawDevilTorso(context, m, layout);
  context.shadowBlur = 0;
  drawDevilNeckAndVest(context, m, layout);
  drawDevilArms(context, m, layout);
  drawDevilHead(context, m, layout);
  drawDevilFace(context, m, layout);
  context.restore();
}

function ensureDevilPairMeshSource() {
  if (devilPairMeshPatternSource) return devilPairMeshPatternSource;
  const c = document.createElement('canvas');
  c.width = 8; c.height = 8;
  const p = c.getContext('2d');
  p.strokeStyle = '#595C63'; p.lineWidth = 1; p.globalAlpha = 0.28;
  p.beginPath(); p.moveTo(0, 8); p.lineTo(8, 0);
  p.moveTo(-2, 2); p.lineTo(2, -2);
  p.moveTo(6, 10); p.lineTo(10, 6); p.stroke();
  p.strokeStyle = '#202229'; p.lineWidth = 0.8; p.globalAlpha = 0.22;
  p.beginPath(); p.moveTo(0, 0); p.lineTo(8, 8);
  p.moveTo(-2, 6); p.lineTo(2, 10);
  p.moveTo(6, -2); p.lineTo(10, 2); p.stroke();
  devilPairMeshPatternSource = c;
  return c;
}

function drawReferenceDevilPairSprite(context) {
  if (!devilPairSpriteImage) {
    return false;
  }

  const spriteWidth = devilPairSpriteImage.naturalWidth || devilPairSpriteImage.width;
  const spriteHeight = devilPairSpriteImage.naturalHeight || devilPairSpriteImage.height;
  const fitScale = Math.min(
    (DEVIL_PAIR_VIEWBOX_WIDTH * 0.97) / spriteWidth,
    (DEVIL_PAIR_VIEWBOX_HEIGHT * 0.98) / spriteHeight,
  );
  const drawWidth = spriteWidth * fitScale;
  const drawHeight = spriteHeight * fitScale;
  const drawX = (DEVIL_PAIR_VIEWBOX_WIDTH - drawWidth) * 0.5;
  const drawY = DEVIL_PAIR_VIEWBOX_HEIGHT - drawHeight;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(devilPairSpriteImage, drawX, drawY, drawWidth, drawHeight);
  return true;
}

function drawVectorDevilPairSprite(context) {
  const meshSource = ensureDevilPairMeshSource();
  const meshPattern = context.createPattern(meshSource, 'repeat');

  drawDevilPairLeftFigure(context);
  context.shadowColor = 'transparent';
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;
  drawDevilPairRightFigure(context, meshPattern);
}

function drawPairFingerGroup(ctx, rotateDeg, pivotX, pivotY, fingers, palmCx, palmCy, palmRx, palmRy) {
  ctx.save();
  ctx.translate(pivotX, pivotY);
  ctx.rotate(rotateDeg * Math.PI / 180);
  ctx.translate(-pivotX, -pivotY);
  ctx.lineJoin = 'round';
  for (const f of fingers) {
    ctx.beginPath(); ctx.moveTo(f[0], f[1]);
    ctx.bezierCurveTo(f[2], f[3], f[4], f[5], f[6], f[7]);
    ctx.lineTo(f[8], f[9]); ctx.lineTo(f[10], f[11]); ctx.closePath();
    ctx.fillStyle = f[12]; ctx.fill();
    ctx.strokeStyle = '#E8E8EA'; ctx.lineWidth = 0.6; ctx.stroke();
  }
  ctx.beginPath(); ctx.ellipse(palmCx, palmCy, palmRx, palmRy, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#FEFEFE'; ctx.fill();
  ctx.restore();
}

function drawDevilPairLeftFigure(ctx) {
  const clothGrad = ctx.createLinearGradient(18, 173, 164, 296);
  clothGrad.addColorStop(0, '#2C2B31'); clothGrad.addColorStop(1, '#101116');
  ctx.beginPath(); ctx.moveTo(18, 293); ctx.lineTo(20, 188);
  ctx.bezierCurveTo(53, 176, 99, 171, 139, 177);
  ctx.bezierCurveTo(152, 179, 161, 183, 167, 191);
  ctx.lineTo(166, 293); ctx.lineTo(18, 293); ctx.closePath();
  ctx.fillStyle = clothGrad; ctx.fill();

  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(24, 229); ctx.bezierCurveTo(59, 208, 99, 190, 156, 173);
  ctx.strokeStyle = '#121318'; ctx.lineWidth = 34; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(138, 233); ctx.bezierCurveTo(112, 212, 81, 191, 35, 176);
  ctx.strokeStyle = '#0E0F14'; ctx.lineWidth = 33; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(24, 229); ctx.bezierCurveTo(59, 208, 99, 190, 156, 173);
  ctx.strokeStyle = '#35363C'; ctx.lineWidth = 23; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(138, 233); ctx.bezierCurveTo(112, 212, 81, 191, 35, 176);
  ctx.strokeStyle = '#2C2D34'; ctx.lineWidth = 22; ctx.stroke();

  drawPairFingerGroup(ctx, -8, 155, 173, [
    [140,173, 142,168, 146,164, 150,162, 153,167, 150,173, '#FEFEFE'],
    [146,164, 148,159, 152,156, 156,155, 158,160, 155,167, '#FEFEFE'],
    [153,159, 155,154, 159,151, 163,151, 164,157, 160,163, '#FEFEFE'],
    [159,157, 161,153, 164,150, 168,151, 168,157, 164,162, '#FCFCFC'],
    [163,163, 166,161, 169,161, 170,164, 167,168, 163,168, '#FCFCFC'],
  ], 155, 173, 16, 10);
  drawPairFingerGroup(ctx, 10, 35, 176, [
    [50,176, 48,171, 44,167, 40,165, 37,170, 40,176, '#FEFEFE'],
    [44,167, 42,162, 38,159, 34,158, 32,163, 35,170, '#FEFEFE'],
    [37,162, 35,157, 31,154, 27,154, 26,160, 30,166, '#FEFEFE'],
    [31,160, 29,156, 26,153, 22,154, 22,160, 26,165, '#FCFCFC'],
    [27,166, 24,164, 21,164, 20,167, 23,171, 27,171, '#FCFCFC'],
  ], 35, 176, 16, 10);

  ctx.fillStyle = '#060710';
  ctx.beginPath(); ctx.moveTo(26, 100);
  ctx.bezierCurveTo(26, 32, 46, 0, 97, 2); ctx.bezierCurveTo(130, 4, 148, 30, 150, 90);
  ctx.bezierCurveTo(148, 98, 140, 104, 138, 78); ctx.bezierCurveTo(136, 47, 124, 24, 99, 23);
  ctx.bezierCurveTo(74, 22, 48, 40, 50, 68); ctx.bezierCurveTo(44, 88, 34, 100, 26, 100);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(36, 30);
  ctx.bezierCurveTo(48, 10, 74, 2, 97, 2); ctx.bezierCurveTo(114, 2, 130, 10, 142, 30);
  ctx.bezierCurveTo(134, 18, 118, 8, 97, 8); ctx.bezierCurveTo(68, 8, 44, 18, 36, 30);
  ctx.closePath(); ctx.fill();

  const spikeData = [
    [43,24, 48,12, 58,4, 82,2, 64,18, '#0A0B10'],
    [78,8, 86,0, 96,-2, 106,0, 100,14, '#080910'],
    [102,2, 110,-2, 120,2, 128,10, 122,18, '#0A0B10'],
    [126,14, 132,8, 138,12, 142,24, 136,22, '#080910'],
    [32,46, 30,34, 32,22, 38,14, 38,32, '#0A0B10'],
    [66,12, 72,4, 80,0, 88,0, 84,14, '#0C0D12'],
    [92,0, 100,-4, 110,-2, 118,4, 110,12, '#0C0D12'],
  ];
  for (const s of spikeData) {
    ctx.beginPath(); ctx.moveTo(s[0], s[1]);
    ctx.bezierCurveTo(s[2], s[3], s[4], s[5], s[6], s[7]);
    ctx.lineTo(s[8], s[9]); ctx.closePath();
    ctx.fillStyle = s[10]; ctx.fill();
  }

  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1E1F28'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.4;
  ctx.beginPath(); ctx.moveTo(40, 40); ctx.bezierCurveTo(50, 22, 74, 12, 97, 10); ctx.stroke();
  ctx.lineWidth = 1.4; ctx.globalAlpha = 0.35;
  ctx.beginPath(); ctx.moveTo(100, 8); ctx.bezierCurveTo(114, 8, 126, 16, 136, 28); ctx.stroke();
  ctx.strokeStyle = '#22232C'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.3;
  ctx.beginPath(); ctx.moveTo(36, 56); ctx.bezierCurveTo(42, 38, 52, 24, 72, 16); ctx.stroke();
  ctx.strokeStyle = '#2A2B34'; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.25;
  ctx.beginPath(); ctx.moveTo(70, 8); ctx.bezierCurveTo(84, 4, 100, 4, 114, 8); ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.save(); ctx.translate(0, 8);
  ctx.fillStyle = '#FAFAFA'; ctx.strokeStyle = '#E0E0E2'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(52, 78); ctx.bezierCurveTo(48, 74, 42, 72, 40, 68);
  ctx.bezierCurveTo(40, 74, 44, 82, 44, 86); ctx.bezierCurveTo(44, 94, 48, 98, 52, 94);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#E4E4E6'; ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(48, 82); ctx.bezierCurveTo(46, 84, 46, 90, 48, 92); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FAFAFA'; ctx.strokeStyle = '#E0E0E2'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(142, 78); ctx.bezierCurveTo(146, 74, 152, 72, 154, 68);
  ctx.bezierCurveTo(154, 74, 150, 82, 150, 86); ctx.bezierCurveTo(150, 94, 146, 98, 142, 94);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#E4E4E6'; ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(146, 82); ctx.bezierCurveTo(148, 84, 148, 90, 146, 92); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  const skinLeft = ctx.createLinearGradient(52, 38, 136, 166);
  skinLeft.addColorStop(0, '#FFFFFF'); skinLeft.addColorStop(0.7, '#FAFAFA'); skinLeft.addColorStop(1, '#F0F0F2');
  ctx.beginPath(); ctx.moveTo(55, 68);
  ctx.bezierCurveTo(58, 40, 74, 22, 99, 23); ctx.bezierCurveTo(124, 24, 136, 47, 138, 78);
  ctx.bezierCurveTo(140, 114, 136, 146, 122, 162);
  ctx.lineTo(110, 176); ctx.lineTo(88, 176); ctx.lineTo(72, 162);
  ctx.bezierCurveTo(58, 146, 51, 99, 55, 68); ctx.closePath();
  ctx.fillStyle = skinLeft; ctx.fill();
  ctx.strokeStyle = '#121318'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.fillStyle = 'rgba(27, 28, 33, 0.06)';
  ctx.beginPath(); ctx.moveTo(49, 98);
  ctx.bezierCurveTo(56, 110, 63, 113, 80, 118); ctx.bezierCurveTo(95, 121, 110, 119, 130, 110);
  ctx.bezierCurveTo(138, 106, 140, 98, 140, 92); ctx.bezierCurveTo(132, 109, 119, 115, 101, 117);
  ctx.bezierCurveTo(80, 119, 63, 113, 49, 98); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(249, 249, 245, 0.12)';
  ctx.beginPath(); ctx.moveTo(55, 44);
  ctx.bezierCurveTo(69, 23, 90, 16, 112, 19); ctx.bezierCurveTo(129, 22, 141, 33, 148, 52);
  ctx.bezierCurveTo(140, 43, 131, 38, 119, 35); ctx.bezierCurveTo(95, 28, 73, 35, 55, 44);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#060710';
  ctx.beginPath(); ctx.moveTo(48, 42);
  ctx.bezierCurveTo(52, 28, 72, 20, 97, 18); ctx.bezierCurveTo(122, 20, 140, 28, 144, 42);
  ctx.bezierCurveTo(142, 52, 130, 58, 97, 58); ctx.bezierCurveTo(64, 58, 52, 52, 48, 42);
  ctx.closePath(); ctx.fill();
  const bangStrands = [
    [56,30, 58,42, 57,52, 56,62, 4, '#060710'],
    [68,22, 68,34, 67,46, 67,58, 3.5, '#0A0B10'],
    [80,18, 79,30, 79,42, 78,54, 4, '#060710'],
    [92,16, 91,28, 91,40, 90,52, 3.5, '#0A0B10'],
    [104,16, 104,28, 104,40, 104,52, 4, '#060710'],
    [116,18, 116,30, 116,42, 116,54, 3.5, '#0A0B10'],
    [128,22, 128,34, 128,46, 127,58, 3.5, '#060710'],
    [138,30, 137,42, 137,52, 136,62, 3, '#0A0B10'],
  ];
  ctx.lineCap = 'round';
  for (const b of bangStrands) {
    ctx.strokeStyle = b[9]; ctx.lineWidth = b[8];
    ctx.beginPath(); ctx.moveTo(b[0], b[1]);
    ctx.bezierCurveTo(b[2], b[3], b[4], b[5], b[6], b[7]); ctx.stroke();
  }

  ctx.save(); ctx.translate(0, 14);
  ctx.fillStyle = '#0B0C10';
  ctx.beginPath(); ctx.moveTo(58, 64);
  ctx.bezierCurveTo(62, 58, 70, 56, 80, 56); ctx.bezierCurveTo(86, 56, 90, 58, 92, 62);
  ctx.lineTo(92, 72); ctx.bezierCurveTo(92, 82, 88, 90, 80, 94);
  ctx.bezierCurveTo(72, 96, 64, 94, 60, 88); ctx.bezierCurveTo(56, 82, 56, 74, 58, 64);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(136, 64);
  ctx.bezierCurveTo(132, 58, 124, 56, 114, 56); ctx.bezierCurveTo(108, 56, 104, 58, 102, 62);
  ctx.lineTo(102, 72); ctx.bezierCurveTo(102, 82, 106, 90, 114, 94);
  ctx.bezierCurveTo(122, 96, 130, 94, 134, 88); ctx.bezierCurveTo(138, 82, 138, 74, 136, 64);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(92, 68, 10, 8);
  ctx.lineCap = 'round'; ctx.lineWidth = 3; ctx.globalAlpha = 0.4;
  ctx.strokeStyle = '#0B0C10';
  ctx.beginPath(); ctx.moveTo(66, 92); ctx.bezierCurveTo(62, 98, 62, 104, 66, 108); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(128, 92); ctx.bezierCurveTo(132, 98, 132, 104, 128, 108); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#090A0E'; ctx.lineWidth = 7.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(60, 68); ctx.bezierCurveTo(70, 56, 82, 48, 97, 52);
  ctx.bezierCurveTo(112, 48, 124, 56, 134, 68); ctx.stroke();
  ctx.lineWidth = 4.5;
  ctx.beginPath(); ctx.moveTo(62, 64); ctx.bezierCurveTo(72, 52, 84, 46, 97, 50); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(97, 50); ctx.bezierCurveTo(110, 46, 122, 52, 132, 64); ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.moveTo(66, 76);
  ctx.bezierCurveTo(70, 72, 76, 70, 84, 70); ctx.bezierCurveTo(90, 70, 94, 73, 94, 78);
  ctx.bezierCurveTo(92, 82, 86, 84, 78, 84); ctx.bezierCurveTo(72, 84, 66, 81, 66, 76);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(128, 76);
  ctx.bezierCurveTo(124, 72, 118, 70, 110, 70); ctx.bezierCurveTo(104, 70, 100, 73, 100, 78);
  ctx.bezierCurveTo(102, 82, 108, 84, 116, 84); ctx.bezierCurveTo(122, 84, 128, 81, 128, 76);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#101218';
  ctx.beginPath(); ctx.ellipse(82, 77, 5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(112, 77, 4.8, 4.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#F7F8F9';
  ctx.beginPath(); ctx.arc(83, 76, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(113, 76, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1A1C22'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(66, 76); ctx.bezierCurveTo(70, 72, 76, 70, 84, 70); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(128, 76); ctx.bezierCurveTo(124, 72, 118, 70, 110, 70); ctx.stroke();
  ctx.strokeStyle = '#2A2C32'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(68, 80); ctx.bezierCurveTo(74, 83, 82, 84, 90, 82); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(126, 80); ctx.bezierCurveTo(120, 83, 112, 84, 104, 82); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.strokeStyle = '#4A4C52'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(97, 82); ctx.bezierCurveTo(99, 96, 98, 118, 92, 138); ctx.stroke();
  ctx.strokeStyle = '#5A5C62'; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(90, 139); ctx.bezierCurveTo(95, 141, 99, 141, 104, 140); ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = '#14161A'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(78, 152); ctx.lineTo(97, 150); ctx.lineTo(116, 152); ctx.stroke();
  ctx.strokeStyle = '#3A3C42'; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(80, 150); ctx.bezierCurveTo(88, 148, 94, 147, 97, 147);
  ctx.bezierCurveTo(100, 147, 106, 148, 114, 150); ctx.stroke();
  ctx.strokeStyle = '#5A5C62'; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.15;
  ctx.beginPath(); ctx.moveTo(82, 155); ctx.bezierCurveTo(90, 153, 96, 153, 97, 153);
  ctx.bezierCurveTo(98, 153, 104, 153, 112, 155); ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawDevilPairRightFigure(ctx, meshPattern) {
  ctx.save();
  ctx.translate(0, 18);

  const clothGrad = ctx.createLinearGradient(182, 190, 342, 314);
  clothGrad.addColorStop(0, '#2C2B31'); clothGrad.addColorStop(1, '#0E1014');
  ctx.beginPath(); ctx.moveTo(184, 275); ctx.lineTo(183, 189);
  ctx.bezierCurveTo(212, 178, 259, 172, 309, 176);
  ctx.bezierCurveTo(326, 177, 338, 182, 343, 191);
  ctx.lineTo(342, 275); ctx.lineTo(184, 275); ctx.closePath();
  ctx.fillStyle = clothGrad; ctx.fill();

  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(192, 232); ctx.bezierCurveTo(223, 211, 260, 191, 315, 178);
  ctx.strokeStyle = '#111318'; ctx.lineWidth = 32; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(339, 235); ctx.bezierCurveTo(304, 212, 267, 193, 214, 176);
  ctx.strokeStyle = '#111318'; ctx.lineWidth = 32; ctx.stroke();
  const armSkinGrad = ctx.createLinearGradient(201, 184, 332, 257);
  armSkinGrad.addColorStop(0, '#FFFFFF'); armSkinGrad.addColorStop(0.55, '#FAFAFA'); armSkinGrad.addColorStop(1, '#F0F0F2');
  ctx.beginPath(); ctx.moveTo(192, 232); ctx.bezierCurveTo(223, 211, 260, 191, 315, 178);
  ctx.strokeStyle = armSkinGrad; ctx.lineWidth = 20; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(339, 235); ctx.bezierCurveTo(304, 212, 267, 193, 214, 176);
  ctx.strokeStyle = armSkinGrad; ctx.lineWidth = 21; ctx.stroke();

  ctx.beginPath(); ctx.moveTo(192, 232); ctx.bezierCurveTo(214, 218, 235, 208, 257, 199);
  ctx.strokeStyle = '#111318'; ctx.lineWidth = 21; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(339, 235); ctx.bezierCurveTo(317, 220, 296, 207, 270, 197);
  ctx.strokeStyle = '#111318'; ctx.lineWidth = 22; ctx.stroke();
  if (meshPattern) {
    ctx.globalAlpha = 0.82;
    ctx.beginPath(); ctx.moveTo(192, 232); ctx.bezierCurveTo(214, 218, 235, 208, 257, 199);
    ctx.strokeStyle = meshPattern; ctx.lineWidth = 15; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(339, 235); ctx.bezierCurveTo(317, 220, 296, 207, 270, 197);
    ctx.strokeStyle = meshPattern; ctx.lineWidth = 15; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.globalAlpha = 0.72;
  ctx.beginPath(); ctx.moveTo(184, 191); ctx.bezierCurveTo(194, 185, 205, 180, 220, 176);
  ctx.strokeStyle = '#14161B'; ctx.lineWidth = 13; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(343, 191); ctx.bezierCurveTo(332, 185, 320, 181, 306, 177);
  ctx.strokeStyle = '#15171C'; ctx.lineWidth = 13; ctx.stroke();
  if (meshPattern) {
    ctx.globalAlpha = 0.78;
    ctx.beginPath(); ctx.moveTo(187, 192); ctx.bezierCurveTo(199, 186, 208, 183, 219, 179);
    ctx.strokeStyle = meshPattern; ctx.lineWidth = 14; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(340, 192); ctx.bezierCurveTo(329, 185, 320, 182, 307, 179);
    ctx.strokeStyle = meshPattern; ctx.lineWidth = 14; ctx.stroke();
  }
  ctx.globalAlpha = 1;

  drawPairFingerGroup(ctx, -11, 214, 176, [
    [199,176, 201,171, 205,167, 209,165, 212,170, 209,176, '#FEFEFE'],
    [205,167, 207,162, 211,159, 215,158, 217,163, 214,170, '#FEFEFE'],
    [212,162, 214,157, 218,154, 222,154, 223,160, 219,166, '#FEFEFE'],
    [218,160, 220,156, 223,153, 227,154, 227,160, 223,165, '#FCFCFC'],
    [222,166, 225,164, 228,164, 229,167, 226,171, 222,171, '#FCFCFC'],
  ], 214, 176, 16, 10);
  drawPairFingerGroup(ctx, 9, 315, 178, [
    [330,178, 328,173, 324,169, 320,167, 317,172, 320,178, '#FEFEFE'],
    [324,169, 322,164, 318,161, 314,160, 312,165, 315,172, '#FEFEFE'],
    [317,164, 315,159, 311,156, 307,156, 306,162, 310,168, '#FEFEFE'],
    [311,162, 309,158, 306,155, 302,156, 302,162, 306,167, '#FCFCFC'],
    [307,168, 304,166, 301,166, 300,169, 303,173, 307,173, '#FCFCFC'],
  ], 315, 178, 16, 10);

  ctx.save(); ctx.translate(-38.7, 6.4); ctx.scale(1.15, 0.92);
  ctx.fillStyle = '#060710';
  ctx.beginPath(); ctx.moveTo(202, 95);
  ctx.bezierCurveTo(198, 36, 216, 6, 252, 5); ctx.bezierCurveTo(288, 4, 314, 34, 316, 85);
  ctx.bezierCurveTo(312, 95, 296, 100, 292, 80); ctx.bezierCurveTo(292, 54, 280, 38, 258, 36);
  ctx.bezierCurveTo(237, 35, 223, 48, 220, 71); ctx.bezierCurveTo(218, 86, 208, 95, 202, 95);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(210, 26);
  ctx.bezierCurveTo(222, 8, 240, 0, 252, 0); ctx.bezierCurveTo(268, 0, 288, 8, 302, 26);
  ctx.bezierCurveTo(292, 14, 274, 4, 252, 4); ctx.bezierCurveTo(232, 4, 218, 14, 210, 26);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0A0B10';
  ctx.beginPath(); ctx.moveTo(204, 56); ctx.bezierCurveTo(200, 42, 202, 26, 210, 14); ctx.lineTo(208, 36); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(310, 50); ctx.bezierCurveTo(314, 36, 316, 22, 312, 12); ctx.lineTo(314, 32); ctx.closePath(); ctx.fill();
  const sweptData = [
    [222,14, 228,4, 238,-2, 248,-2, 242,12, '#0A0B10'],
    [244,2, 254,-4, 266,-2, 276,6, 268,12, '#080910'],
    [280,10, 288,4, 296,6, 304,16, 296,16, '#0A0B10'],
    [210,24, 206,14, 208,4, 216,-2, 214,16, '#080910'],
    [234,6, 240,-2, 250,-4, 258,-2, 252,8, '#0C0D12'],
    [260,0, 270,-4, 280,0, 288,8, 280,8, '#0C0D12'],
  ];
  for (const s of sweptData) {
    ctx.beginPath(); ctx.moveTo(s[0], s[1]);
    ctx.bezierCurveTo(s[2], s[3], s[4], s[5], s[6], s[7]);
    ctx.lineTo(s[8], s[9]); ctx.closePath();
    ctx.fillStyle = s[10]; ctx.fill();
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1E1F28'; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.38;
  ctx.beginPath(); ctx.moveTo(212, 42); ctx.bezierCurveTo(220, 22, 236, 10, 254, 8); ctx.stroke();
  ctx.lineWidth = 1.3; ctx.globalAlpha = 0.33;
  ctx.beginPath(); ctx.moveTo(258, 6); ctx.bezierCurveTo(272, 6, 288, 12, 300, 24); ctx.stroke();
  ctx.strokeStyle = '#22232C'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.28;
  ctx.beginPath(); ctx.moveTo(206, 60); ctx.bezierCurveTo(210, 40, 220, 24, 234, 14); ctx.stroke();
  ctx.strokeStyle = '#2A2B34'; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.22;
  ctx.beginPath(); ctx.moveTo(238, 4); ctx.bezierCurveTo(252, 0, 268, 0, 282, 6); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.fillStyle = '#FAFAFA'; ctx.strokeStyle = '#E0E0E2'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(220, 78); ctx.bezierCurveTo(216, 74, 210, 72, 208, 68);
  ctx.bezierCurveTo(208, 74, 212, 82, 212, 86); ctx.bezierCurveTo(212, 94, 216, 98, 220, 94);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#E4E4E6'; ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(216, 82); ctx.bezierCurveTo(214, 84, 214, 90, 216, 92); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FAFAFA'; ctx.strokeStyle = '#E0E0E2'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(292, 78); ctx.bezierCurveTo(296, 74, 302, 72, 304, 68);
  ctx.bezierCurveTo(304, 74, 300, 82, 300, 86); ctx.bezierCurveTo(300, 94, 296, 98, 292, 94);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#E4E4E6'; ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(296, 82); ctx.bezierCurveTo(298, 84, 298, 90, 296, 92); ctx.stroke();
  ctx.globalAlpha = 1;

  const skinRight = ctx.createLinearGradient(218, 60, 294, 188);
  skinRight.addColorStop(0, '#FFFFFF'); skinRight.addColorStop(0.7, '#FAFAFA'); skinRight.addColorStop(1, '#F0F0F2');
  ctx.beginPath(); ctx.moveTo(224, 71);
  ctx.bezierCurveTo(227, 48, 240, 35, 258, 36); ctx.bezierCurveTo(276, 38, 288, 54, 288, 80);
  ctx.bezierCurveTo(289, 100, 286, 126, 276, 142); ctx.bezierCurveTo(270, 150, 264, 154, 258, 154);
  ctx.bezierCurveTo(252, 154, 246, 150, 240, 142); ctx.bezierCurveTo(230, 126, 224, 100, 224, 71);
  ctx.closePath(); ctx.fillStyle = skinRight; ctx.fill();
  ctx.beginPath(); ctx.moveTo(240, 142);
  ctx.bezierCurveTo(246, 150, 252, 154, 258, 154); ctx.bezierCurveTo(264, 154, 270, 150, 276, 142);
  ctx.bezierCurveTo(274, 154, 268, 162, 258, 162); ctx.bezierCurveTo(248, 162, 242, 154, 240, 142);
  ctx.closePath(); ctx.fillStyle = skinRight; ctx.fill();
  ctx.beginPath(); ctx.moveTo(224, 71);
  ctx.bezierCurveTo(227, 48, 240, 35, 258, 36); ctx.bezierCurveTo(276, 38, 288, 54, 288, 80);
  ctx.bezierCurveTo(289, 100, 286, 126, 276, 142); ctx.bezierCurveTo(270, 150, 264, 154, 258, 154);
  ctx.bezierCurveTo(252, 154, 246, 150, 240, 142); ctx.bezierCurveTo(230, 126, 224, 100, 224, 71);
  ctx.closePath(); ctx.strokeStyle = '#121318'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.fillStyle = 'rgba(27, 28, 33, 0.06)';
  ctx.beginPath(); ctx.moveTo(218, 92);
  ctx.bezierCurveTo(224, 104, 232, 110, 244, 114); ctx.bezierCurveTo(252, 116, 264, 114, 278, 108);
  ctx.bezierCurveTo(286, 104, 290, 96, 290, 88); ctx.bezierCurveTo(284, 102, 274, 110, 258, 112);
  ctx.bezierCurveTo(242, 114, 228, 106, 218, 92); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(249, 248, 245, 0.3)';
  ctx.beginPath(); ctx.moveTo(224, 62);
  ctx.bezierCurveTo(236, 45, 250, 38, 266, 40); ctx.bezierCurveTo(278, 41, 287, 47, 293, 58);
  ctx.bezierCurveTo(282, 47, 269, 42, 253, 42); ctx.bezierCurveTo(241, 42, 231, 49, 224, 62);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#0B0C10';
  ctx.beginPath(); ctx.moveTo(224, 64);
  ctx.bezierCurveTo(228, 58, 234, 56, 242, 56); ctx.bezierCurveTo(248, 56, 252, 58, 254, 62);
  ctx.lineTo(254, 72); ctx.bezierCurveTo(254, 80, 250, 88, 244, 92);
  ctx.lineTo(238, 102); ctx.lineTo(232, 92);
  ctx.bezierCurveTo(228, 86, 224, 80, 224, 72); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(292, 64);
  ctx.bezierCurveTo(288, 58, 282, 56, 274, 56); ctx.bezierCurveTo(268, 56, 264, 58, 262, 62);
  ctx.lineTo(262, 72); ctx.bezierCurveTo(262, 80, 266, 88, 272, 92);
  ctx.lineTo(278, 102); ctx.lineTo(284, 92);
  ctx.bezierCurveTo(288, 86, 292, 80, 292, 72); ctx.closePath(); ctx.fill();
  ctx.fillRect(254, 68, 8, 8);

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.moveTo(230, 78);
  ctx.bezierCurveTo(234, 74, 240, 72, 246, 72); ctx.bezierCurveTo(251, 72, 254, 75, 254, 80);
  ctx.bezierCurveTo(252, 83, 247, 85, 240, 85); ctx.bezierCurveTo(235, 85, 230, 82, 230, 78);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(286, 78);
  ctx.bezierCurveTo(282, 74, 276, 72, 270, 72); ctx.bezierCurveTo(265, 72, 262, 75, 262, 80);
  ctx.bezierCurveTo(264, 83, 269, 85, 276, 85); ctx.bezierCurveTo(281, 85, 286, 82, 286, 78);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#101218';
  ctx.beginPath(); ctx.ellipse(244, 79, 4.4, 4.0, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(272, 79, 4.2, 3.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#F7F8F9';
  ctx.beginPath(); ctx.arc(245, 78, 1.05, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(273, 78, 1.0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1A1C22'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(230, 78); ctx.bezierCurveTo(234, 74, 240, 72, 246, 72); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(286, 78); ctx.bezierCurveTo(282, 74, 276, 72, 270, 72); ctx.stroke();
  ctx.strokeStyle = '#2A2C32'; ctx.lineWidth = 1.1; ctx.globalAlpha = 0.45;
  ctx.beginPath(); ctx.moveTo(232, 82); ctx.bezierCurveTo(237, 84, 244, 85, 250, 83); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(284, 82); ctx.bezierCurveTo(279, 84, 272, 85, 266, 83); ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = '#4A4C52'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(258, 84); ctx.bezierCurveTo(259, 96, 257, 110, 251, 124); ctx.stroke();
  ctx.strokeStyle = '#5A5C62'; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(249, 125); ctx.bezierCurveTo(254, 127, 258, 127, 263, 126); ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = '#0A0B10'; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(258, 126); ctx.lineTo(242, 132); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(258, 126); ctx.lineTo(274, 132); ctx.stroke();

  ctx.strokeStyle = '#14161A'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(240, 140); ctx.lineTo(258, 138); ctx.lineTo(276, 140); ctx.stroke();
  ctx.strokeStyle = '#3A3C42'; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.55;
  ctx.beginPath(); ctx.moveTo(242, 138); ctx.bezierCurveTo(250, 136, 256, 135, 258, 135);
  ctx.bezierCurveTo(260, 135, 266, 136, 274, 138); ctx.stroke();
  ctx.strokeStyle = '#5A5C62'; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.12;
  ctx.beginPath(); ctx.moveTo(244, 143); ctx.bezierCurveTo(250, 141, 256, 141, 258, 141);
  ctx.bezierCurveTo(260, 141, 266, 141, 272, 143); ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.restore();
}

function createDevilPairGeometry(pairWidth) {
  const scale = pairWidth / DEVIL_PAIR_VIEWBOX_WIDTH;
  const pairHeight = DEVIL_PAIR_VIEWBOX_HEIGHT * scale;
  const centerX = DEVIL_PAIR_VIEWBOX_WIDTH * 0.5;
  const centerY = DEVIL_PAIR_VIEWBOX_HEIGHT * 0.5;
  const hemRadius = (DEVIL_PAIR_HEM_RADIUS + DEVIL_PAIR_HEM_BLEED) * scale;
  const toLocalPoint = (x, y) => ({
    x: (x - centerX) * scale,
    y: (y - centerY) * scale,
  });
  const toLocalEllipse = (x, y, rx, ry, angle = 0) => ({
    x: (x - centerX) * scale,
    y: (y - centerY) * scale,
    rx: rx * scale,
    ry: ry * scale,
    angle,
  });
  const torsoPolygons = [
    [[20, 186], [54, 176], [138, 176], [165, 189], [166, 294], [18, 294]].map(([x, y]) => toLocalPoint(x, y)),
    [[183, 188], [214, 178], [309, 176], [342, 190], [342, 294], [184, 294]].map(([x, y]) => toLocalPoint(x, y)),
  ];
  const handRegions = [
    toLocalEllipse(155, 173, 18, 12, -0.14),
    toLocalEllipse(35, 176, 18, 12, 0.15),
    toLocalEllipse(214, 176, 18, 12, -0.18),
    toLocalEllipse(315, 178, 18, 12, 0.14),
  ];
  const armSegments = [
    { ...toLocalPoint(24, 229), ...{ bx: toLocalPoint(156, 173).x, by: toLocalPoint(156, 173).y }, radius: 18 * scale },
    { ...toLocalPoint(138, 233), ...{ bx: toLocalPoint(35, 176).x, by: toLocalPoint(35, 176).y }, radius: 17 * scale },
    { ...toLocalPoint(196, 232), ...{ bx: toLocalPoint(315, 178).x, by: toLocalPoint(315, 178).y }, radius: 17 * scale },
    { ...toLocalPoint(338, 235), ...{ bx: toLocalPoint(214, 176).x, by: toLocalPoint(214, 176).y }, radius: 18 * scale },
  ];
  const headRegions = [
    toLocalEllipse(99, 96, 50, 86, -0.03),
    toLocalEllipse(257, 98, 51, 74, 0.05),
  ];
  const hemCutouts = [
    {
      corner: 'bl',
      x: toLocalPoint(18, 294).x,
      y: toLocalPoint(18, 294).y,
      radius: hemRadius,
    },
    {
      corner: 'br',
      x: toLocalPoint(342, 294).x,
      y: toLocalPoint(342, 294).y,
      radius: hemRadius,
    },
  ];

  return {
    pairWidth,
    pairHeight,
    maxHalfWidth: pairWidth * 0.5,
    bodyLength: pairHeight,
    shoulderWidth: 100 * scale,
    torsoHeight: 118 * scale,
    shadowBlur: Math.max(5, pairWidth * 0.075),
    armThickness: 36 * scale,
    headRegions,
    torsoPolygons,
    hemCutouts,
    handRegions,
    armSegments,
    wispBounds: {
      left: -pairWidth * 0.36,
      right: pairWidth * 0.36,
      top: -pairHeight * 0.28,
      bottom: pairHeight * 0.2,
    },
  };
}

function appendDevilHemCutoutPath(context, corner, edgeX, edgeY, radius) {
  if (corner === 'bl') {
    context.moveTo(edgeX, edgeY - radius);
    context.lineTo(edgeX, edgeY);
    context.lineTo(edgeX + radius, edgeY);
    context.arc(edgeX + radius, edgeY - radius, radius, Math.PI / 2, Math.PI);
    context.closePath();
    return;
  }

  context.moveTo(edgeX, edgeY - radius);
  context.lineTo(edgeX, edgeY);
  context.lineTo(edgeX - radius, edgeY);
  context.arc(edgeX - radius, edgeY - radius, radius, Math.PI / 2, 0, true);
  context.closePath();
}

function clipDevilPairHem(context) {
  context.beginPath();
  context.rect(-24, -24, DEVIL_PAIR_VIEWBOX_WIDTH + 48, DEVIL_PAIR_VIEWBOX_HEIGHT + 48);
  appendDevilHemCutoutPath(context, 'bl', 18, 294, DEVIL_PAIR_HEM_RADIUS + DEVIL_PAIR_HEM_BLEED);
  appendDevilHemCutoutPath(context, 'br', 342, 294, DEVIL_PAIR_HEM_RADIUS + DEVIL_PAIR_HEM_BLEED);
  context.clip('evenodd');
}

function eraseDevilPairHem(context) {
  context.save();
  context.globalCompositeOperation = 'destination-out';
  context.beginPath();
  appendDevilHemCutoutPath(
    context,
    'bl',
    18,
    294,
    DEVIL_PAIR_HEM_RADIUS + DEVIL_PAIR_HEM_BLEED + DEVIL_PAIR_HEM_CLEANUP
  );
  appendDevilHemCutoutPath(
    context,
    'br',
    342,
    294,
    DEVIL_PAIR_HEM_RADIUS + DEVIL_PAIR_HEM_BLEED + DEVIL_PAIR_HEM_CLEANUP
  );
  context.fill();
  context.restore();
}

function pointInDevilHemCutout(px, py, cutout, padding = 0) {
  const radius = Math.max(0, cutout.radius - padding);
  if (radius <= 0) {
    return false;
  }

  if (cutout.corner === 'bl') {
    if (px < cutout.x || px > cutout.x + radius || py < cutout.y - radius || py > cutout.y) {
      return false;
    }

    const dx = px - (cutout.x + radius);
    const dy = py - (cutout.y - radius);
    return dx * dx + dy * dy > radius * radius;
  }

  if (px < cutout.x - radius || px > cutout.x || py < cutout.y - radius || py > cutout.y) {
    return false;
  }

  const dx = px - (cutout.x - radius);
  const dy = py - (cutout.y - radius);
  return dx * dx + dy * dy > radius * radius;
}

function pointInAnyDevilHemCutout(px, py, metrics, padding = 0) {
  return Array.isArray(metrics.hemCutouts)
    ? metrics.hemCutouts.some((cutout) => pointInDevilHemCutout(px, py, cutout, padding))
    : false;
}

function drawDevilPairSprite(context, metrics, pose = {}) {
  const alpha = pose.alpha ?? 1;
  const breathPhase = pose.breathPhase || 0;
  const pulse = 1 + Math.sin(breathPhase) * 0.014;
  const verticalOffset = Math.sin(breathPhase * 0.72) * metrics.pairHeight * 0.01;
  const scale = metrics.pairWidth / DEVIL_PAIR_VIEWBOX_WIDTH;

  context.save();
  context.globalAlpha = alpha;
  context.translate(0, verticalOffset);
  context.scale(pulse, 1 + Math.cos(breathPhase * 0.68) * 0.01);

  // Transform to SVG viewBox coordinate system (360x300, centered)
  context.scale(scale, scale);
  context.translate(-DEVIL_PAIR_VIEWBOX_WIDTH * 0.5, -DEVIL_PAIR_VIEWBOX_HEIGHT * 0.5);

  // Drop shadow approximation
  context.save();
  clipDevilPairHem(context);
  context.shadowColor = 'rgba(7, 8, 13, 0.12)';
  context.shadowOffsetY = 8;
  context.shadowBlur = 20;
  if (!drawReferenceDevilPairSprite(context)) {
    drawVectorDevilPairSprite(context);
  }
  context.restore();

  eraseDevilPairHem(context);

  context.restore();
}

function devilPairContainsLocalPoint(localX, localY, metrics, padding = 0) {
  for (const region of metrics.headRegions) {
    if (pointInOrientedEllipse(localX, localY, region.x, region.y, region.angle, region.rx + padding, region.ry + padding)) {
      return true;
    }
  }

  for (const polygon of metrics.torsoPolygons) {
    if (pointInPolygon(localX, localY, polygon) && !pointInAnyDevilHemCutout(localX, localY, metrics, padding)) {
      return true;
    }

    if (padding > 0) {
      for (let index = 0; index < polygon.length; index += 1) {
        const current = polygon[index];
        const next = polygon[(index + 1) % polygon.length];
        if (
          pointToSegmentDistance(localX, localY, current.x, current.y, next.x, next.y) <= padding &&
          !pointInAnyDevilHemCutout(localX, localY, metrics, padding)
        ) {
          return true;
        }
      }
    }
  }

  for (const region of metrics.handRegions) {
    if (pointInOrientedEllipse(localX, localY, region.x, region.y, region.angle, region.rx + padding, region.ry + padding)) {
      return true;
    }
  }

  for (const segment of metrics.armSegments) {
    if (pointToSegmentDistance(localX, localY, segment.x, segment.y, segment.bx, segment.by) <= segment.radius + padding) {
      return true;
    }
  }

  return false;
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

function createParchmentEdgePoint(axis, edgePosition, basePosition, offset, inwardSign) {
  if (axis === 'horizontal') {
    return {
      x: edgePosition,
      y: basePosition + offset * inwardSign,
    };
  }

  return {
    x: basePosition + offset * inwardSign,
    y: edgePosition,
  };
}

function createParchmentWearMarks(random, amplitude, options = {}) {
  const {
    countRange = [1, 3],
    widthRange = [0.08, 0.18],
    depthRange = [0.22, 0.58],
    centerPadding = 0.12,
    focusCenter = null,
    focusSpread = 0.18,
    focusMix = 0,
  } = options;
  const [minCount, maxCount] = countRange;
  const count = Math.max(0, Math.floor(seededBetween(random, minCount, maxCount + 0.999)));
  const marks = [];

  for (let index = 0; index < count; index += 1) {
    const baseCenter = seededBetween(random, centerPadding, 1 - centerPadding);
    const focusedCenter = focusCenter == null
      ? baseCenter
      : clamp(
        focusCenter + seededBetween(random, -focusSpread, focusSpread),
        centerPadding,
        1 - centerPadding
      );
    marks.push({
      center: lerp(baseCenter, focusedCenter, focusMix),
      width: seededBetween(random, widthRange[0], widthRange[1]),
      depth: amplitude * seededBetween(random, depthRange[0], depthRange[1]),
    });
  }

  return marks.sort((a, b) => a.center - b.center);
}

function sampleParchmentWear(progress, marks) {
  let total = 0;

  for (const mark of marks) {
    const distance = Math.abs(progress - mark.center);
    if (distance >= mark.width) {
      continue;
    }

    const normalized = 1 - distance / mark.width;
    total += mark.depth * normalized * normalized * (0.58 + normalized * 0.42);
  }

  return total;
}

function createSoftParchmentEdge(random, options) {
  const {
    axis,
    start,
    end,
    basePosition,
    inwardSign,
    amplitude,
    waveCount,
    sampleCount,
    outwardRatio = 0.42,
    inwardRatio = 0.9,
    biasDirection = 0,
    biasCenter = null,
    reverse = false,
  } = options;

  const edgePoints = [];
  const primaryPhase = seededBetween(random, -Math.PI, Math.PI);
  const secondaryPhase = seededBetween(random, -Math.PI, Math.PI);
  const driftPhase = seededBetween(random, -Math.PI, Math.PI);
  const startFadeSpan = seededBetween(random, 0.12, 0.22);
  const endFadeSpan = seededBetween(random, 0.12, 0.24);
  const resolvedBiasCenter =
    biasCenter ??
    (biasDirection < 0
      ? seededBetween(random, 0.18, 0.34)
      : biasDirection > 0
        ? seededBetween(random, 0.64, 0.82)
        : seededBetween(random, 0.36, 0.64));
  const startStrength =
    biasDirection < 0
      ? seededBetween(random, 1.02, 1.18)
      : seededBetween(random, 0.82, 1.02);
  const endStrength =
    biasDirection > 0
      ? seededBetween(random, 1.04, 1.22)
      : seededBetween(random, 0.82, 1.02);
  const edgeSlope = amplitude * seededBetween(random, 0.06, 0.18) * biasDirection;
  const inwardBias = amplitude * seededBetween(random, 0.02, 0.08);
  const majorWearMarks = createParchmentWearMarks(random, amplitude, {
    countRange: [1, 3],
    widthRange: [0.1, 0.2],
    depthRange: [0.16, 0.38],
    focusCenter: resolvedBiasCenter,
    focusSpread: 0.12,
    focusMix: 0.84,
  });
  const minorWearMarks = createParchmentWearMarks(random, amplitude, {
    countRange: [2, 5],
    widthRange: [0.035, 0.08],
    depthRange: [0.04, 0.14],
    centerPadding: 0.08,
    focusCenter: resolvedBiasCenter,
    focusSpread: 0.22,
    focusMix: 0.38,
  });

  for (let index = 1; index < sampleCount; index += 1) {
    const progress = index / sampleCount;
    const edgePosition = lerp(start, end, progress);
    const startFade = clamp(progress / startFadeSpan, 0, 1);
    const endFade = clamp((1 - progress) / endFadeSpan, 0, 1);
    const fade = Math.pow(startFade * endFade, 0.72);
    const sideStrength = lerp(startStrength, endStrength, progress);
    const taper = fade * sideStrength;
    const primaryWave = Math.sin(progress * Math.PI * waveCount + primaryPhase);
    const secondaryWave = Math.sin(progress * Math.PI * (waveCount * 1.72) + secondaryPhase);
    const driftWave = Math.sin(progress * Math.PI * 0.92 + driftPhase);
    const wearOffset =
      sampleParchmentWear(progress, majorWearMarks) +
      sampleParchmentWear(progress, minorWearMarks);
    const rawOffset =
      (primaryWave * 0.68 + secondaryWave * 0.18 + driftWave * 0.08) * amplitude * taper +
      edgeSlope * (progress - 0.5) * 2 +
      inwardBias * taper +
      wearOffset * taper;
    const offset = clamp(rawOffset, -amplitude * outwardRatio, amplitude * inwardRatio);

    edgePoints.push(createParchmentEdgePoint(axis, edgePosition, basePosition, offset, inwardSign));
  }

  return reverse ? edgePoints.reverse() : edgePoints;
}

function createParchmentOutline(panelRect) {
  const { x, y, width, height } = panelRect;
  const random = createSeededRandom(Math.round(width * 13 + height * 17));
  const topInset = clamp(height * 0.014, 5, 12);
  const rightInset = clamp(width * 0.014, 5, 11);
  const bottomInset = clamp(height * 0.016, 6, 14);
  const leftInset = clamp(width * 0.014, 5, 11);
  const cornerRadiusX = clamp(width * 0.028, 8, 18);
  const cornerRadiusY = clamp(height * 0.028, 8, 18);
  const horizontalAmplitude = clamp(height * 0.02, 7, 15);
  const verticalAmplitude = clamp(width * 0.015, 6, 12);

  const topLeftTop = {
    x: x + cornerRadiusX * seededBetween(random, 0.9, 1.06),
    y: y + topInset + seededBetween(random, -1.2, 1.2),
  };
  const topRightTop = {
    x: x + width - cornerRadiusX * seededBetween(random, 0.9, 1.08),
    y: y + topInset + seededBetween(random, -1.2, 1.2),
  };
  const topRightSide = {
    x: x + width - rightInset + seededBetween(random, -1.1, 1.1),
    y: y + cornerRadiusY * seededBetween(random, 0.88, 1.04),
  };
  const bottomRightSide = {
    x: x + width - rightInset + seededBetween(random, -1.1, 1.1),
    y: y + height - cornerRadiusY * seededBetween(random, 0.9, 1.08),
  };
  const bottomRightBottom = {
    x: x + width - cornerRadiusX * seededBetween(random, 0.9, 1.08),
    y: y + height - bottomInset + seededBetween(random, -1.3, 1.3),
  };
  const bottomLeftBottom = {
    x: x + cornerRadiusX * seededBetween(random, 0.92, 1.08),
    y: y + height - bottomInset + seededBetween(random, -1.3, 1.3),
  };
  const bottomLeftSide = {
    x: x + leftInset + seededBetween(random, -1.1, 1.1),
    y: y + height - cornerRadiusY * seededBetween(random, 0.9, 1.08),
  };
  const topLeftSide = {
    x: x + leftInset + seededBetween(random, -1.1, 1.1),
    y: y + cornerRadiusY * seededBetween(random, 0.88, 1.04),
  };

  const topEdge = createSoftParchmentEdge(random, {
    axis: 'horizontal',
    start: topLeftTop.x,
    end: topRightTop.x,
    basePosition: y + topInset,
    inwardSign: 1,
    amplitude: horizontalAmplitude,
    waveCount: 4.1,
    sampleCount: 10,
    outwardRatio: 0.34,
    inwardRatio: 0.94,
    biasDirection: -1,
    biasCenter: 0.24,
  });
  const rightEdge = createSoftParchmentEdge(random, {
    axis: 'vertical',
    start: topRightSide.y,
    end: bottomRightSide.y,
    basePosition: x + width - rightInset,
    inwardSign: -1,
    amplitude: verticalAmplitude,
    waveCount: 3.2,
    sampleCount: 9,
    outwardRatio: 0.28,
    inwardRatio: 0.98,
    biasDirection: 1,
    biasCenter: 0.68,
  });
  const bottomEdge = createSoftParchmentEdge(random, {
    axis: 'horizontal',
    start: bottomLeftBottom.x,
    end: bottomRightBottom.x,
    basePosition: y + height - bottomInset,
    inwardSign: -1,
    amplitude: horizontalAmplitude * 1.06,
    waveCount: 4.3,
    sampleCount: 10,
    outwardRatio: 0.36,
    inwardRatio: 1,
    biasDirection: 1,
    biasCenter: 0.74,
    reverse: true,
  });
  const leftEdge = createSoftParchmentEdge(random, {
    axis: 'vertical',
    start: topLeftSide.y,
    end: bottomLeftSide.y,
    basePosition: x + leftInset,
    inwardSign: 1,
    amplitude: verticalAmplitude,
    waveCount: 3.15,
    sampleCount: 9,
    outwardRatio: 0.28,
    inwardRatio: 0.98,
    biasDirection: 1,
    biasCenter: 0.58,
    reverse: true,
  });

  return [
    topLeftTop,
    topLeftTop,
    ...topEdge,
    topRightTop,
    topRightTop,
    topRightSide,
    topRightSide,
    ...rightEdge,
    bottomRightSide,
    bottomRightSide,
    bottomRightBottom,
    bottomRightBottom,
    ...bottomEdge,
    bottomLeftBottom,
    bottomLeftBottom,
    bottomLeftSide,
    bottomLeftSide,
    ...leftEdge,
    topLeftSide,
    topLeftSide,
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

function getTextObstacleClearance(cellWidth, lineHeight, outlineGapPercent = settings.textOutlineGapPercent) {
  return getTextClearance(cellWidth, lineHeight) * (outlineGapPercent / OUTLINE_GAP_BASELINE_PERCENT);
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
  const outlineGapBase = Math.round(Number(candidate.textOutlineGapPercent) || DEFAULT_SETTINGS.textOutlineGapPercent);
  const textOutlineGapPercent = clamp(
    Math.round(outlineGapBase / 5) * 5,
    MIN_OUTLINE_GAP_PERCENT,
    MAX_OUTLINE_GAP_PERCENT
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
    textOutlineGapPercent,
    textColor: normalizeHexColor(candidate.textColor, DEFAULT_SETTINGS.textColor),
    fontFamily,
    textFlowIntervalMs,
    paperColor: normalizeHexColor(
      candidate.paperColor ?? candidate.backgroundColor,
      DEFAULT_SETTINGS.paperColor
    ),
  };
}

function migrateLegacyDefaultSettings(rawSettings, safeSettings) {
  if (!rawSettings || typeof rawSettings !== 'object') {
    return safeSettings;
  }

  const normalizedFontSize = Math.round(Number(rawSettings.fontSizePx) || Number.NaN);
  const normalizedTextColor = normalizeHexColor(rawSettings.textColor, LEGACY_DEFAULT_SETTINGS.textColor);
  const normalizedFontFamily = FONT_OPTIONS[rawSettings.fontFamily]
    ? rawSettings.fontFamily
    : DEFAULT_SETTINGS.fontFamily;
  const intervalBase = Math.round(Number(rawSettings.textFlowIntervalMs) || LEGACY_DEFAULT_SETTINGS.textFlowIntervalMs);
  const normalizedTextFlowIntervalMs = clamp(
    Math.round(intervalBase / 10) * 10,
    MIN_TEXT_FLOW_INTERVAL_MS,
    MAX_TEXT_FLOW_INTERVAL_MS
  );
  const normalizedPaperColor = normalizeHexColor(
    rawSettings.paperColor ?? rawSettings.backgroundColor,
    LEGACY_DEFAULT_SETTINGS.paperColor
  );

  const isLegacyDefaultSettings =
    normalizedFontSize === LEGACY_DEFAULT_SETTINGS.fontSizePx &&
    normalizedTextColor === LEGACY_DEFAULT_SETTINGS.textColor &&
    normalizedFontFamily === LEGACY_DEFAULT_SETTINGS.fontFamily &&
    normalizedTextFlowIntervalMs === LEGACY_DEFAULT_SETTINGS.textFlowIntervalMs &&
    normalizedPaperColor === LEGACY_DEFAULT_SETTINGS.paperColor;

  if (!isLegacyDefaultSettings) {
    return safeSettings;
  }

  return {
    ...safeSettings,
    fontSizePx: DEFAULT_SETTINGS.fontSizePx,
  };
}

function loadSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    const safeSettings = sanitizeSettings(parsed);
    return migrateLegacyDefaultSettings(parsed, safeSettings);
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

function formatFontSizeLabel(fontSizePx) {
  const delta = fontSizePx - FONT_SIZE_BASELINE_PX;

  if (delta === 0) {
    return `${fontSizePx} px (基準)`;
  }

  return `${fontSizePx} px (${delta > 0 ? `+${delta}` : delta})`;
}

function formatOutlineGapLabel(percent) {
  const delta = percent - OUTLINE_GAP_BASELINE_PERCENT;

  if (delta === 0) {
    return `${percent} % (基準)`;
  }

  return `${percent} % (${delta > 0 ? `+${delta}` : delta})`;
}

function updateConfigValueLabels() {
  fontSizeValueEl.textContent = formatFontSizeLabel(Number(fontSizeInputEl.value));
  outlineGapValueEl.textContent = formatOutlineGapLabel(Number(outlineGapInputEl.value));
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
  outlineGapInputEl.value = String(safeSettings.textOutlineGapPercent);
  textColorInputEl.value = safeSettings.textColor;
  fontFamilyInputEl.value = safeSettings.fontFamily;
  textIntervalInputEl.value = String(safeSettings.textFlowIntervalMs);
  paperColorInputEl.value = safeSettings.paperColor;
  updateConfigValueLabels();
}

function readConfigForm() {
  return sanitizeSettings({
    fontSizePx: Number(fontSizeInputEl.value),
    textOutlineGapPercent: Number(outlineGapInputEl.value),
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
  const sproutScale = 0.55;
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
    hopStride: clamp(minDim * 0.22, 88, 172),
    minHopStride: clamp(minDim * 0.1, 42, 84),
    hopHeight: clamp(minDim * 0.24, 96, 220),
    hopHeightVariance: clamp(minDim * 0.06, 22, 52),
    minHopDuration: 0.48,
    maxHopDuration: 0.76,
    maxLateralDrift: clamp(minDim * 0.085, 34, 74),
    retargetChance: 0.2,
    landingBobAmplitude: clamp(minDim * 0.02, 8, 18),
    idleBobAmplitude: clamp(minDim * 0.006, 1.8, 4.8),
    targetThreshold: clamp(minDim * 0.16, 56, 120),
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

function estimateBlockedSlots(metrics, cellWidth, lineHeight, obstacleClearance, layoutCharacter = null) {
  const padding = Number.isFinite(obstacleClearance)
    ? obstacleClearance
    : getTextObstacleClearance(cellWidth, lineHeight);
  const override =
    (layoutCharacter && typeof layoutCharacter.estimateBlockedSlots === 'function'
      ? layoutCharacter.estimateBlockedSlots(cellWidth, lineHeight, padding)
      : undefined) ??
    (metrics && typeof metrics.estimateBlockedSlots === 'function'
      ? metrics.estimateBlockedSlots(cellWidth, lineHeight, padding)
      : undefined);

  if (Number.isFinite(override)) {
    return Math.max(0, Math.round(override));
  }

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
  const viewportMarginX = clamp(W * 0.012, 8, 20);
  const viewportMarginTop = clamp(H * 0.045, 34, 64);
  const viewportMarginBottom = clamp(H * 0.018, 8, 22);
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

  const maxScaledWidth = Math.max(220, W - viewportMarginX * 2);
  const maxScaledHeight = Math.max(260, H - viewportMarginTop - viewportMarginBottom);
  const appliedScale = Math.min(PARCHMENT_SCALE, maxScaledWidth / width, maxScaledHeight / height);
  width = Math.min(width * appliedScale, maxScaledWidth);
  height = Math.min(height * appliedScale, maxScaledHeight);

  const x = (W - width) * 0.5;
  const centeredY = outerMarginTop + (availableHeight - height) * 0.5;
  const y = clamp(centeredY, viewportMarginTop, H - height - viewportMarginBottom);
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
  const motionEdgeClearance = getTextClearance(cellWidth, lineHeight);
  const textObstacleClearance = getTextObstacleClearance(
    cellWidth,
    lineHeight,
    settings.textOutlineGapPercent
  );
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
  const devilMetrics = createDevilMetrics(panelRect);
  const activeMetrics = selectedCharacter === 'devil'
    ? devilMetrics
    : selectedCharacter === 'sprout'
      ? sproutMetrics
      : fishMetrics;
  const blockedSlots = estimateBlockedSlots(activeMetrics, cellWidth, lineHeight, textObstacleClearance);
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
    devilMetrics,
    activeMetrics,
    blockedSlots,
    spareSlots,
    motionEdgeClearance,
    textObstacleClearance,
    visibleTarget,
    textLines: textContent.lines,
    textGlyphCount: textContent.glyphCount,
  };
}

function getMotionBounds(layout, layoutCharacter = null) {
  const metrics = layout.activeMetrics;
  const overrideInsets =
    (layoutCharacter && typeof layoutCharacter.getMotionInsets === 'function'
      ? layoutCharacter.getMotionInsets()
      : undefined) ??
    (metrics && typeof metrics.getMotionInsets === 'function'
      ? metrics.getMotionInsets()
      : undefined);
  const motionInsets = overrideInsets || metrics.motionInsets || {
    left: (metrics.headLength || metrics.bodyLength * 0.2) * 0.72,
    right: (metrics.headLength || metrics.bodyLength * 0.2) * 0.72,
    top: metrics.maxHalfWidth * 1.35,
    bottom: metrics.maxHalfWidth * 1.35,
  };
  return {
    minX: layout.innerX + motionInsets.left + layout.motionEdgeClearance * 0.55,
    maxX: layout.innerX + layout.innerWidth - motionInsets.right - layout.motionEdgeClearance * 0.55,
    minY: layout.innerY + motionInsets.top + layout.motionEdgeClearance * 0.35,
    maxY: layout.innerY + layout.innerHeight - motionInsets.bottom - layout.motionEdgeClearance * 0.35,
  };
}

function createDevilMetrics(panelLayout) {
  const minDim = Math.min(panelLayout.innerWidth, panelLayout.innerHeight);
  const pairAspect = DEVIL_PAIR_ASPECT;
  const preferredWidth = clamp(panelLayout.innerWidth * 0.43, 112, 260);
  const maxWidthFromHeight = Math.max(108, panelLayout.innerHeight * pairAspect * 0.44);
  const pairWidth = Math.min(preferredWidth, maxWidthFromHeight);
  const geometry = createDevilPairGeometry(pairWidth);

  return {
    ...geometry,
    driftSpeed: clamp(minDim * 0.07, 24, 40),
    hoverAmplitude: clamp(minDim * 0.016, 6, 14),
    hoverSpeed: 0.9,
    swayAmplitude: clamp(minDim * 0.00048, 0.018, 0.038),

    getMotionInsets() {
      return {
        left: geometry.pairWidth * 0.56,
        right: geometry.pairWidth * 0.56,
        top: geometry.pairHeight * 0.56,
        bottom: geometry.pairHeight * 0.54,
      };
    },

    estimateBlockedSlots(cellWidth, lineHeight, padding) {
      const cellArea = Math.max(1, cellWidth * lineHeight);
      const paddedHeight = geometry.pairHeight + padding * 2.3;
      const paddedWidth = geometry.pairWidth + padding * 2.1;
      return Math.ceil(((paddedWidth * paddedHeight * 0.64) / cellArea) * 1.42);
    },
  };
}

class ParticlePool {
  constructor(capacity) {
    this.particles = [];

    for (let index = 0; index < capacity; index += 1) {
      this.particles.push({
        alive: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        alpha: 0,
        maxAlpha: 1,
        size: 2,
        age: 0,
        lifetime: 1,
        hue: 45,
        saturation: 80,
        lightness: 75,
        twinklePhase: 0,
        twinkleSpeed: 5,
        shape: 0,
      });
    }
  }

  acquire() {
    for (const particle of this.particles) {
      if (!particle.alive) {
        particle.alive = true;
        return particle;
      }
    }

    return null;
  }

  release(particle) {
    particle.alive = false;
  }
}

class ParticleSystem {
  constructor(capacity = 256) {
    this.pool = new ParticlePool(capacity);
  }

  emitFishTail(x, y, headingX, headingY) {
    const particle = this.pool.acquire();
    if (!particle) {
      return;
    }

    particle.vx = -headingX * randomBetween(15, 25) + randomBetween(-6, 6);
    particle.vy = -headingY * randomBetween(15, 25) + randomBetween(-12, -2);
    this._initCommon(
      particle,
      x,
      y,
      randomBetween(1.5, 3.5),
      randomBetween(0.8, 1.6),
      randomBetween(0.55, 0.95)
    );
  }

  emitFishBody(x, y) {
    const particle = this.pool.acquire();
    if (!particle) {
      return;
    }

    particle.vx = randomBetween(-8, 8);
    particle.vy = randomBetween(-14, -3);
    this._initCommon(
      particle,
      x,
      y,
      randomBetween(1.0, 2.2),
      randomBetween(0.6, 1.2),
      randomBetween(0.3, 0.6)
    );
  }

  emitSproutLanding(x, y, count) {
    for (let index = 0; index < count; index += 1) {
      const particle = this.pool.acquire();
      if (!particle) {
        continue;
      }

      const angle = Math.PI + Math.random() * Math.PI;
      const speed = randomBetween(30, 60);
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      this._initCommon(
        particle,
        x,
        y,
        randomBetween(2.0, 4.0),
        randomBetween(0.4, 0.9),
        randomBetween(0.7, 1.0)
      );
    }
  }

  emitSproutLaunch(x, y, count) {
    for (let index = 0; index < count; index += 1) {
      const particle = this.pool.acquire();
      if (!particle) {
        continue;
      }

      const angle = randomBetween(-0.4, 0.4);
      const speed = randomBetween(15, 30);
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed * 0.5;
      this._initCommon(
        particle,
        x,
        y,
        randomBetween(1.5, 3.0),
        randomBetween(0.3, 0.7),
        randomBetween(0.5, 0.85)
      );
    }
  }

  emitSproutTip(x, y) {
    const particle = this.pool.acquire();
    if (!particle) {
      return;
    }

    particle.vx = randomBetween(-6, 6);
    particle.vy = randomBetween(-16, -4);
    this._initCommon(
      particle,
      x,
      y,
      randomBetween(1.0, 2.5),
      randomBetween(0.5, 1.2),
      randomBetween(0.4, 0.8)
    );
  }

  emitDevilWisp(x, y) {
    const particle = this.pool.acquire();
    if (!particle) {
      return;
    }

    particle.vx = randomBetween(-5, 5);
    particle.vy = randomBetween(-12, -3);
    this._initCommon(
      particle,
      x,
      y,
      randomBetween(1.2, 3.0),
      randomBetween(1.0, 2.5),
      randomBetween(0.28, 0.58)
    );
    particle.hue = randomBetween(260, 290);
    particle.saturation = randomBetween(46, 74);
    particle.lightness = randomBetween(58, 78);
    particle.shape = Math.random() < 0.72 ? 0 : 1;
  }

  _initCommon(particle, x, y, size, lifetime, maxAlpha) {
    particle.x = x;
    particle.y = y;
    particle.size = size;
    particle.lifetime = lifetime;
    particle.maxAlpha = maxAlpha;
    particle.age = 0;
    particle.alpha = maxAlpha;
    particle.twinklePhase = Math.random() * Math.PI * 2;
    particle.twinkleSpeed = randomBetween(4, 8);

    const shapeRoll = Math.random();
    particle.shape = shapeRoll < 0.4 ? 0 : shapeRoll < 0.7 ? 1 : 2;

    if (Math.random() < 0.15) {
      particle.hue = randomBetween(35, 55);
      particle.saturation = 10;
      particle.lightness = 95;
      return;
    }

    particle.hue = randomBetween(35, 55);
    particle.saturation = randomBetween(60, 90);
    particle.lightness = randomBetween(65, 92);
  }

  update(dt) {
    for (const particle of this.pool.particles) {
      if (!particle.alive) {
        continue;
      }

      particle.age += dt;
      if (particle.age >= particle.lifetime) {
        this.pool.release(particle);
        continue;
      }

      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy *= 0.97;
      particle.vx *= 0.98;

      const lifeFraction = particle.age / particle.lifetime;
      particle.alpha = particle.maxAlpha * (1 - Math.pow(lifeFraction, 1.8));
      particle.alpha *= 0.75 + 0.25 * Math.sin(particle.twinklePhase + particle.age * particle.twinkleSpeed);
    }
  }

  draw(context, panelLayout) {
    if (!panelLayout) {
      return;
    }

    context.save();
    context.beginPath();
    parchmentPath(context, panelLayout);
    context.clip();
    context.globalCompositeOperation = 'screen';

    for (const particle of this.pool.particles) {
      if (!particle.alive || particle.alpha < 0.01) {
        continue;
      }
      if (
        particle.x + particle.size * 2.5 < panelLayout.x ||
        particle.x - particle.size * 2.5 > panelLayout.x + panelLayout.width ||
        particle.y + particle.size * 2.5 < panelLayout.y ||
        particle.y - particle.size * 2.5 > panelLayout.y + panelLayout.height
      ) {
        continue;
      }

      const color = `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%, ${particle.alpha})`;
      const glowColor = `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%, ${particle.alpha * 0.15})`;

      context.fillStyle = glowColor;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size * 2.5, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = color;

      if (particle.shape === 0) {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      } else if (particle.shape === 1) {
        context.beginPath();
        context.moveTo(particle.x, particle.y - particle.size);
        context.lineTo(particle.x + particle.size * 0.5, particle.y);
        context.lineTo(particle.x, particle.y + particle.size);
        context.lineTo(particle.x - particle.size * 0.5, particle.y);
        context.closePath();
        context.fill();
      } else {
        const outer = particle.size;
        const inner = particle.size * 0.3;
        context.beginPath();
        context.moveTo(particle.x, particle.y - outer);
        context.lineTo(particle.x + inner, particle.y - inner);
        context.lineTo(particle.x + outer, particle.y);
        context.lineTo(particle.x + inner, particle.y + inner);
        context.lineTo(particle.x, particle.y + outer);
        context.lineTo(particle.x - inner, particle.y + inner);
        context.lineTo(particle.x - outer, particle.y);
        context.lineTo(particle.x - inner, particle.y - inner);
        context.closePath();
        context.fill();
      }
    }

    context.restore();
  }
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
    this.tailEmitAccum = 0;
    this.bodyEmitAccum = 0;
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

  emitParticles(particleSystemRef, dt) {
    if (!particleSystemRef || !this.segments.length) {
      return;
    }

    const tail = this.segments[this.segments.length - 1];
    const tailTipX = tail.x - tail.tangent.x * (this.metrics.tailLength * 0.8);
    const tailTipY = tail.y - tail.tangent.y * (this.metrics.tailLength * 0.8);

    this.tailEmitAccum += 90 * dt;
    while (this.tailEmitAccum >= 1) {
      particleSystemRef.emitFishTail(tailTipX, tailTipY, tail.tangent.x, tail.tangent.y);
      this.tailEmitAccum -= 1;
    }

    this.bodyEmitAccum += 20 * dt;
    while (this.bodyEmitAccum >= 1) {
      const segment = this.segments[Math.floor(Math.random() * this.segments.length)];
      const offset = randomBetween(-0.5, 0.5) * segment.halfWidth;
      particleSystemRef.emitFishBody(
        segment.x + segment.normal.x * offset,
        segment.y + segment.normal.y * offset
      );
      this.bodyEmitAccum -= 1;
    }
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
    this.tipEmitAccum = 0;
    this.justLanded = false;
    this.justLaunched = false;
    this.pickTarget(true);
    this.startHop(true);
  }

  pickTarget(forceWide = false) {
    const insetX = forceWide ? 0 : (this.bounds.maxX - this.bounds.minX) * 0.035;
    const insetY = forceWide ? 0 : (this.bounds.maxY - this.bounds.minY) * 0.05;
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

  toWorldPoint(localX, localY) {
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    const rotatedX = localX * this.facing;
    const rotatedY = localY;

    return {
      x: this.x + rotatedX * cos - rotatedY * sin,
      y: this.displayY + rotatedX * sin + rotatedY * cos,
    };
  }

  startHop(forceInitial = false) {
    const m = this.metrics;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distanceToTarget = Math.hypot(dx, dy);

    if (!forceInitial && (distanceToTarget < m.targetThreshold || Math.random() < m.retargetChance)) {
      this.pickTarget(Math.random() < 0.42);
    }

    const nextDx = this.targetX - this.x;
    const nextDy = this.targetY - this.y;
    const nextDistance = Math.hypot(nextDx, nextDy) || 1;
    const dirX = nextDx / nextDistance;
    const dirY = nextDy / nextDistance;
    const normalX = -dirY;
    const normalY = dirX;
    const stride = clamp(
      nextDistance * randomBetween(0.58, 0.9),
      m.minHopStride,
      m.hopStride
    );
    const lateralDrift =
      randomBetween(-m.maxLateralDrift, m.maxLateralDrift) *
      clamp(nextDistance / Math.max(1, m.hopStride), 0.45, 1);

    this.hopStartX = this.x;
    this.hopStartY = this.y;
    this.hopEndX = clamp(this.x + dirX * stride + normalX * lateralDrift, this.bounds.minX, this.bounds.maxX);
    this.hopEndY = clamp(this.y + dirY * stride * 1.08 + normalY * lateralDrift * 0.72, this.bounds.minY, this.bounds.maxY);
    this.hopElapsed = 0;
    this.hopDuration = randomBetween(m.minHopDuration, m.maxHopDuration);
    this.hopHeight = clamp(
      m.hopHeight + randomBetween(-m.hopHeightVariance, m.hopHeightVariance) + stride * 0.4,
      m.hopHeight * 0.85,
      m.hopHeight * 1.7
    );
    this.hopProgress = 0;

    if (Math.abs(this.hopEndX - this.x) > 1.5) {
      this.facing = this.hopEndX >= this.x ? 1 : -1;
    }
  }

  update(dt, timestamp) {
    const m = this.metrics;
    this.hopElapsed += dt;
    const previousProgress = this.hopProgress;
    const progress = clamp(this.hopElapsed / this.hopDuration, 0, 1);
    this.hopProgress = progress;
    const travel = 1 - Math.pow(1 - progress, 2);

    this.x = lerp(this.hopStartX, this.hopEndX, travel);
    this.y = lerp(this.hopStartY, this.hopEndY, travel);

    const hopLift = Math.sin(progress * Math.PI) * this.hopHeight;
    const touchdownPulse = Math.max(0, 1 - Math.abs(progress - 0.95) / 0.08);
    const launchPulse = Math.max(0, 1 - Math.abs(progress - 0.06) / 0.08);
    this.walkPhase += dt * lerp(6.8, 10.6, hopLift / Math.max(1, this.hopHeight));

    const bobTarget =
      -hopLift +
      Math.sin(timestamp * 0.0024 + this.walkPhase * 0.22) * m.idleBobAmplitude +
      Math.sin(progress * Math.PI * 2.4) * m.landingBobAmplitude * 0.18 -
      touchdownPulse * m.landingBobAmplitude * 0.26 +
      launchPulse * m.landingBobAmplitude * 0.14;
    this.bobOffset += (bobTarget - this.bobOffset) * (1 - Math.exp(-dt * 14));
    this.displayY = clamp(this.y + this.bobOffset, this.bounds.minY, this.bounds.maxY + m.footSize);

    const horizontalTravel = this.hopEndX - this.hopStartX;
    const verticalTravel = this.hopEndY - this.hopStartY;
    const arcTilt = Math.sin(progress * Math.PI) * 0.075 * this.facing;
    const targetRotation =
      clamp(horizontalTravel / Math.max(1, m.hopStride) * 0.11, -0.11, 0.11) +
      clamp(verticalTravel / Math.max(1, m.hopStride) * 0.04, -0.04, 0.04) +
      arcTilt;
    this.rotation += (targetRotation - this.rotation) * (1 - Math.exp(-dt * 8));

    if (previousProgress < 0.92 && progress >= 0.92) {
      this.justLanded = true;
    }

    if (progress >= 1) {
      this.justLaunched = true;
      this.x = this.hopEndX;
      this.y = this.hopEndY;
      this.startHop();
    }
  }

  emitParticles(particleSystemRef, dt) {
    if (!particleSystemRef) {
      return;
    }

    const footY = this.displayY + this.metrics.legLength * 0.92;

    if (this.justLanded) {
      particleSystemRef.emitSproutLanding(this.x, footY, randomBetween(8, 12) | 0);
      this.justLanded = false;
    }

    if (this.justLaunched) {
      particleSystemRef.emitSproutLaunch(this.x, footY, randomBetween(4, 6) | 0);
      this.justLaunched = false;
    }

    const tipWorld = this.toWorldPoint(this.metrics.hookTipX, this.metrics.hookTipY);
    this.tipEmitAccum += 45 * dt;
    while (this.tipEmitAccum >= 1) {
      particleSystemRef.emitSproutTip(tipWorld.x, tipWorld.y);
      this.tipEmitAccum -= 1;
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

class DevilWanderer {
  constructor(metrics, bounds) {
    this.metrics = metrics;
    this.bounds = bounds;
    this.x = randomBetween(bounds.minX, bounds.maxX);
    this.y = randomBetween(bounds.minY, bounds.maxY);
    this.displayY = this.y;
    this.vx = randomBetween(-1, 1) * metrics.driftSpeed * 0.35;
    this.vy = randomBetween(-1, 1) * metrics.driftSpeed * 0.2;
    this.targetX = this.x;
    this.targetY = this.y;
    this.alpha = 1;
    this.swayAngle = 0;
    this.hoverPhase = Math.random() * Math.PI * 2;
    this.breathPhase = Math.random() * Math.PI * 2;
    this.facing = Math.random() < 0.5 ? -1 : 1;
    this.wispEmitAccum = 0;
    this.pickTarget();
  }

  pickTarget() {
    const minDistance = this.metrics.shoulderWidth * 2.4;
    const insetX = (this.bounds.maxX - this.bounds.minX) * 0.02;
    const insetY = (this.bounds.maxY - this.bounds.minY) * 0.03;

    for (let attempt = 0; attempt < 18; attempt += 1) {
      const targetX = randomBetween(this.bounds.minX + insetX, this.bounds.maxX - insetX);
      const targetY = randomBetween(this.bounds.minY + insetY, this.bounds.maxY - insetY);
      if (Math.hypot(targetX - this.x, targetY - this.y) >= minDistance) {
        this.targetX = targetX;
        this.targetY = targetY;
        return;
      }
    }

    this.targetX = randomBetween(this.bounds.minX + insetX, this.bounds.maxX - insetX);
    this.targetY = randomBetween(this.bounds.minY + insetY, this.bounds.maxY - insetY);
  }

  toLocalPoint(px, py) {
    const dx = px - this.x;
    const dy = py - this.displayY;
    const cos = Math.cos(this.swayAngle);
    const sin = Math.sin(this.swayAngle);
    return {
      x: (dx * cos + dy * sin) * this.facing,
      y: -dx * sin + dy * cos,
    };
  }

  updatePhases(dt, timestamp) {
    const m = this.metrics;
    this.hoverPhase += dt * m.hoverSpeed;
    this.breathPhase += dt * 1.2;
    this._hoverOffset =
      Math.sin(this.hoverPhase) * m.hoverAmplitude +
      Math.sin(this.hoverPhase * 0.37) * m.hoverAmplitude * 0.3;
    const targetSway = Math.sin(timestamp * 0.0008 + this.hoverPhase * 0.18) * m.swayAmplitude;
    this.swayAngle += (targetSway - this.swayAngle) * (1 - Math.exp(-dt * 4.2));
  }

  updateDrift(dt, timestamp) {
    const m = this.metrics;
    const boundsWidth = Math.max(1, this.bounds.maxX - this.bounds.minX);
    const boundsHeight = Math.max(1, this.bounds.maxY - this.bounds.minY);
    const centerX = (this.bounds.minX + this.bounds.maxX) * 0.5;
    const centerY = (this.bounds.minY + this.bounds.maxY) * 0.5;

    const toTargetX = this.targetX - this.x;
    const toTargetY = this.targetY - this.y;
    const targetDistance = Math.hypot(toTargetX, toTargetY);
    if (targetDistance < m.shoulderWidth * 1.9) {
      this.pickTarget();
    }

    const targetDir = normalize(this.targetX - this.x, this.targetY - this.y);
    const centerDir = normalize(centerX - this.x, centerY - this.y);
    const horizontalBias = clamp((Math.abs(this.x - centerX) / (boundsWidth * 0.5) - 0.80) / 0.20, 0, 1);
    const verticalBias = clamp((Math.abs(this.y - centerY) / (boundsHeight * 0.5) - 0.78) / 0.22, 0, 1);
    const centerBias = Math.max(horizontalBias, verticalBias);
    const driftWaveX = Math.sin(timestamp * 0.00042 + this.hoverPhase * 0.63) * m.driftSpeed * 0.18;
    const driftWaveY = Math.cos(timestamp * 0.00036 + this.hoverPhase * 0.31) * m.driftSpeed * 0.12;
    const desiredSpeed = m.driftSpeed * (0.74 + Math.sin(timestamp * 0.00027 + this.hoverPhase) * 0.12);
    const desiredVx = lerp(targetDir.x, centerDir.x, centerBias * 0.45) * desiredSpeed + driftWaveX;
    const desiredVy = lerp(targetDir.y, centerDir.y, centerBias * 0.45) * desiredSpeed * 0.88 + driftWaveY;
    const ease = 1 - Math.exp(-dt * 1.65);

    this.vx += (desiredVx - this.vx) * ease;
    this.vy += (desiredVy - this.vy) * ease;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x <= this.bounds.minX) {
      this.x = this.bounds.minX;
      this.vx = Math.abs(this.vx) * 0.55;
      this.pickTarget();
    } else if (this.x >= this.bounds.maxX) {
      this.x = this.bounds.maxX;
      this.vx = -Math.abs(this.vx) * 0.55;
      this.pickTarget();
    }

    if (this.y <= this.bounds.minY) {
      this.y = this.bounds.minY;
      this.vy = Math.abs(this.vy) * 0.55;
      this.pickTarget();
    } else if (this.y >= this.bounds.maxY) {
      this.y = this.bounds.maxY;
      this.vy = -Math.abs(this.vy) * 0.55;
      this.pickTarget();
    }
  }

  updateFacing() {
    const facingThreshold = Math.max(1.4, this.metrics.driftSpeed * 0.1);
    if (this.vx > facingThreshold) {
      this.facing = 1;
    } else if (this.vx < -facingThreshold) {
      this.facing = -1;
    }
  }

  update(dt, timestamp) {
    this.updatePhases(dt, timestamp);
    this.updateDrift(dt, timestamp);
    this.displayY = clamp(this.y + this._hoverOffset, this.bounds.minY, this.bounds.maxY);
    this.alpha = 1;
    this.updateFacing();
  }

  draw(context) {
    context.save();
    context.translate(this.x, this.displayY);
    context.rotate(this.swayAngle);
    context.scale(this.facing, 1);
    drawDevilFigure(context, this.metrics, {
      alpha: this.alpha,
      breathPhase: this.breathPhase,
    });
    context.restore();
  }

  contains(px, py, padding = 0) {
    const m = this.metrics;
    const local = this.toLocalPoint(px, py);
    const layout = getDevilFigureLayout(m);
    const torsoHalfWidth = Math.max(layout.torsoHalfTop, layout.torsoHalfBottom) + padding;

    if (pointInOrientedEllipse(local.x, local.y, 0, layout.headCenterY, 0, m.headRx + padding, m.headRy + padding)) {
      return true;
    }

    if (
      local.x >= -torsoHalfWidth &&
      local.x <= torsoHalfWidth &&
      local.y >= layout.torsoTopY - padding &&
      local.y <= layout.torsoBottomY + padding
    ) {
      return true;
    }

    if (
      pointToSegmentDistance(
        local.x,
        local.y,
        layout.leftShoulder.x,
        layout.leftShoulder.y,
        layout.rightHand.x,
        layout.rightHand.y
      ) <= m.armWidth * 0.5 + padding
    ) {
      return true;
    }

    return (
      pointToSegmentDistance(
        local.x,
        local.y,
        layout.rightShoulder.x,
        layout.rightShoulder.y,
        layout.leftHand.x,
        layout.leftHand.y
      ) <= m.armWidth * 0.5 + padding
    );
  }

  emitParticles(particleSystemRef, dt) {
    if (!particleSystemRef) {
      return;
    }

    this.wispEmitAccum += 25 * dt;
    while (this.wispEmitAccum >= 1) {
      const ox = randomBetween(-this.metrics.shoulderWidth, this.metrics.shoulderWidth);
      const oy = randomBetween(-this.metrics.torsoHeight * 0.5, this.metrics.torsoHeight * 0.3);
      particleSystemRef.emitDevilWisp(this.x + ox, this.displayY + oy);
      this.wispEmitAccum -= 1;
    }
  }
}

class DevilPair {
  constructor(metrics, bounds) {
    this.metrics = metrics;
    this.bounds = bounds;
    this.anchor = new DevilWanderer(metrics, bounds);
    this.anchor.facing = 1;
    this.wispEmitAccum = 0;
  }

  toLocalPoint(px, py) {
    const dx = px - this.anchor.x;
    const dy = py - this.anchor.displayY;
    const cos = Math.cos(this.anchor.swayAngle);
    const sin = Math.sin(this.anchor.swayAngle);
    return {
      x: dx * cos + dy * sin,
      y: -dx * sin + dy * cos,
    };
  }

  update(dt, timestamp) {
    this.anchor.update(dt, timestamp);
    this.anchor.facing = 1;
  }

  draw(context) {
    context.save();
    context.translate(this.anchor.x, this.anchor.displayY);
    context.rotate(this.anchor.swayAngle);
    drawDevilPairSprite(context, this.metrics, {
      alpha: this.anchor.alpha,
      breathPhase: this.anchor.breathPhase,
    });
    context.restore();
  }

  emitParticles(particleSystem, dt) {
    if (!particleSystem) {
      return;
    }

    this.wispEmitAccum += 28 * dt;
    while (this.wispEmitAccum >= 1) {
      const ox = randomBetween(this.metrics.wispBounds.left, this.metrics.wispBounds.right);
      const oy = randomBetween(this.metrics.wispBounds.top, this.metrics.wispBounds.bottom);
      particleSystem.emitDevilWisp(this.anchor.x + ox, this.anchor.displayY + oy);
      this.wispEmitAccum -= 1;
    }
  }

  contains(px, py, padding = 0) {
    const local = this.toLocalPoint(px, py);
    return devilPairContainsLocalPoint(local.x, local.y, this.metrics, padding);
  }
}

function createCharacter(type, panelLayout, bounds) {
  if (type === 'devil') {
    const metrics = panelLayout.devilMetrics || createDevilMetrics(panelLayout);
    return new DevilPair(metrics, bounds);
  }
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
  particleSystem = new ParticleSystem(256);
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
  if (particleSystem) {
    particleSystem.draw(ctx, panel);
  }
  drawText();
  ctx.save();
  parchmentPath(ctx, panel);
  ctx.clip();
  character.draw(ctx);
  ctx.restore();
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

  parchmentPath(ctx, panel);
  ctx.globalCompositeOperation = 'multiply';
  ctx.strokeStyle = 'rgba(124, 88, 54, 0.075)';
  ctx.lineWidth = clamp(Math.min(panel.width, panel.height) * 0.024, 5, 11);
  ctx.lineJoin = 'round';
  ctx.stroke();
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

function buildRowRangesFromFlags(rowSlots, blockedFlags, targetBlocked) {
  if (!rowSlots.length || !blockedFlags.length) {
    return [];
  }

  const ranges = [];
  let startIndex = -1;

  for (let index = 0; index < rowSlots.length; index += 1) {
    const matches = Boolean(blockedFlags[index]) === targetBlocked;

    if (matches) {
      if (startIndex < 0) {
        startIndex = index;
      }
      continue;
    }

    if (startIndex >= 0) {
      ranges.push({
        startIndex,
        endIndex: index - 1,
        slots: rowSlots.slice(startIndex, index),
        capacity: index - startIndex,
        leftBlocked: startIndex > 0 ? Boolean(blockedFlags[startIndex - 1]) : false,
        rightBlocked: Boolean(blockedFlags[index]),
      });
      startIndex = -1;
    }
  }

  if (startIndex >= 0) {
    ranges.push({
      startIndex,
      endIndex: rowSlots.length - 1,
      slots: rowSlots.slice(startIndex),
      capacity: rowSlots.length - startIndex,
      leftBlocked: startIndex > 0 ? Boolean(blockedFlags[startIndex - 1]) : false,
      rightBlocked: false,
    });
  }

  return ranges;
}

function markBlockedFlagsFromRange(blockedFlags, rowSlots, range) {
  if (!range || !blockedFlags.length || !rowSlots.length) {
    return;
  }

  const hasIndexBounds =
    Number.isFinite(range.start) && Number.isFinite(range.end)
      ? { start: range.start, end: range.end }
      : Number.isFinite(range.startIndex) && Number.isFinite(range.endIndex)
        ? { start: range.startIndex, end: range.endIndex }
        : null;

  if (hasIndexBounds) {
    const startIndex = clamp(Math.floor(Math.min(hasIndexBounds.start, hasIndexBounds.end)), 0, rowSlots.length - 1);
    const endIndex = clamp(Math.ceil(Math.max(hasIndexBounds.start, hasIndexBounds.end)), 0, rowSlots.length - 1);
    for (let index = startIndex; index <= endIndex; index += 1) {
      blockedFlags[index] = true;
    }
    return;
  }

  const minX =
    Number.isFinite(range.minX) ? range.minX : Number.isFinite(range.left) ? range.left : undefined;
  const maxX =
    Number.isFinite(range.maxX) ? range.maxX : Number.isFinite(range.right) ? range.right : undefined;

  if (!Number.isFinite(minX) || !Number.isFinite(maxX)) {
    return;
  }

  const left = Math.min(minX, maxX);
  const right = Math.max(minX, maxX);
  for (let index = 0; index < rowSlots.length; index += 1) {
    const slotX = rowSlots[index].x;
    if (slotX >= left && slotX <= right) {
      blockedFlags[index] = true;
    }
  }
}

function buildBlockedFlagsForRow(rowSlots, inflate) {
  if (!rowSlots.length || !character) {
    return [];
  }

  const rowY = rowSlots[0].y;
  const rowBounds = {
    left: rowSlots[0].x,
    right: rowSlots[rowSlots.length - 1].x,
    minX: rowSlots[0].x,
    maxX: rowSlots[rowSlots.length - 1].x,
    slots: rowSlots,
  };
  const overrideRanges =
    typeof character.getBlockedRangesAtRow === 'function'
      ? character.getBlockedRangesAtRow(rowY, inflate, rowBounds)
      : undefined;

  if (Array.isArray(overrideRanges)) {
    const blockedFlags = Array.from({ length: rowSlots.length }, () => false);
    for (const range of overrideRanges) {
      markBlockedFlagsFromRange(blockedFlags, rowSlots, range);
    }
    return blockedFlags;
  }

  return rowSlots.map((slot) => character.contains(slot.x, slot.y, inflate));
}

function buildBlockedRangesForRow(rowSlots, inflate) {
  const blockedFlags = buildBlockedFlagsForRow(rowSlots, inflate);
  return buildRowRangesFromFlags(rowSlots, blockedFlags, true);
}

function buildAvailableRangesForRow(rowSlots, blockedRanges) {
  if (!rowSlots.length) {
    return [];
  }

  const blockedFlags = Array.from({ length: rowSlots.length }, () => false);
  for (const range of blockedRanges) {
    for (let index = range.startIndex; index <= range.endIndex; index += 1) {
      blockedFlags[index] = true;
    }
  }
  return buildRowRangesFromFlags(rowSlots, blockedFlags, false);
}

function buildRangeSelectionOrder(range) {
  const slots = range.slots;

  if (!range.rightBlocked) {
    return slots;
  }

  if (!range.leftBlocked) {
    return [...slots].reverse();
  }

  const ordered = [];
  let leftIndex = 0;
  let rightIndex = slots.length - 1;

  while (leftIndex <= rightIndex) {
    ordered.push(slots[leftIndex]);
    if (rightIndex !== leftIndex) {
      ordered.push(slots[rightIndex]);
    }
    leftIndex += 1;
    rightIndex -= 1;
  }

  return ordered;
}

function rebalanceSmallFragments(availableRanges, rangeCounts, take) {
  const minClusterSlots = 3;
  if (take < minClusterSlots || availableRanges.length <= 1) {
    return rangeCounts;
  }

  const balancedCounts = [...rangeCounts];

  for (let index = availableRanges.length - 1; index >= 0; index -= 1) {
    const fragmentCount = balancedCounts[index];
    if (fragmentCount <= 0 || fragmentCount >= minClusterSlots) {
      continue;
    }

    const neighborIndices = [index - 1, index + 1];
    for (const neighborIndex of neighborIndices) {
      if (neighborIndex < 0 || neighborIndex >= availableRanges.length) {
        continue;
      }

      const nextCount = balancedCounts[neighborIndex] + fragmentCount;
      if (nextCount < minClusterSlots || nextCount > availableRanges[neighborIndex].capacity) {
        continue;
      }

      balancedCounts[neighborIndex] = nextCount;
      balancedCounts[index] = 0;
      break;
    }
  }

  return balancedCounts;
}

function sortSelectedSlotsForReadingOrder(slots) {
  return [...slots].sort((a, b) => a.x - b.x || a.y - b.y);
}

function selectLeftToRightSlots(availableRanges, take) {
  if (!availableRanges.length || take <= 0) {
    return [];
  }

  const selectedSlots = [];

  for (const range of availableRanges) {
    for (const slot of range.slots) {
      selectedSlots.push({ x: slot.x, y: slot.y });
      if (selectedSlots.length >= take) {
        return selectedSlots;
      }
    }
  }

  return selectedSlots;
}

function selectLineStartSlots(availableRanges, take) {
  if (!availableRanges.length || take <= 0) {
    return [];
  }

  const [firstRange, ...remainingRanges] = availableRanges;
  const leadingCount = Math.min(take, firstRange.capacity);
  const leadingSlots = firstRange.slots.slice(0, leadingCount).map((slot) => ({ x: slot.x, y: slot.y }));

  if (leadingSlots.length >= take) {
    return leadingSlots;
  }

  const trailingSlots = allocateSlotsAcrossRanges(remainingRanges, take - leadingSlots.length);
  return sortSelectedSlotsForReadingOrder([...leadingSlots, ...trailingSlots]);
}

function allocateSlotsAcrossRanges(availableRanges, take) {
  if (!availableRanges.length || take <= 0) {
    return [];
  }

  const totalCapacity = availableRanges.reduce((sum, range) => sum + range.capacity, 0);
  if (take >= totalCapacity) {
    return sortSelectedSlotsForReadingOrder(
      availableRanges.flatMap((range) => range.slots.map((slot) => ({ x: slot.x, y: slot.y })))
    );
  }

  const rangeCounts = [];
  const remainders = [];
  let allocated = 0;

  for (let index = 0; index < availableRanges.length; index += 1) {
    const range = availableRanges[index];
    const exactCount = (take * range.capacity) / totalCapacity;
    const baseCount = Math.min(range.capacity, Math.floor(exactCount));
    rangeCounts.push(baseCount);
    remainders.push({
      index,
      remainder: exactCount - baseCount,
      capacity: range.capacity,
    });
    allocated += baseCount;
  }

  while (allocated < take) {
    let candidate = null;

    for (const entry of remainders) {
      if (rangeCounts[entry.index] >= availableRanges[entry.index].capacity) {
        continue;
      }

      if (
        !candidate ||
        entry.remainder > candidate.remainder ||
        (entry.remainder === candidate.remainder && entry.capacity > candidate.capacity) ||
        (entry.remainder === candidate.remainder &&
          entry.capacity === candidate.capacity &&
          entry.index < candidate.index)
      ) {
        candidate = entry;
      }
    }

    if (!candidate) {
      break;
    }

    rangeCounts[candidate.index] += 1;
    candidate.remainder = -1;
    allocated += 1;
  }

  const balancedCounts = rebalanceSmallFragments(availableRanges, rangeCounts, take);
  const selectedSlots = [];

  for (let index = 0; index < availableRanges.length; index += 1) {
    const count = balancedCounts[index];
    if (count <= 0) {
      continue;
    }

    const orderedSlots = buildRangeSelectionOrder(availableRanges[index]);
    selectedSlots.push(...orderedSlots.slice(0, count).map((slot) => ({ x: slot.x, y: slot.y })));
  }

  return sortSelectedSlotsForReadingOrder(selectedSlots);
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
    const rowSlots = panel.slots.slice(rowStart, rowEnd);
    const blockedRanges = buildBlockedRangesForRow(rowSlots, panel.textObstacleClearance);
    const availableRanges = buildAvailableRangesForRow(rowSlots, blockedRanges);

    if (!availableRanges.length) {
      continue;
    }

    const remainingChars = currentLine.length - lineOffset;
    if (remainingChars <= 0) {
      lineIndex += 1;
      lineOffset = 0;
      continue;
    }

    const availableSlots = availableRanges.reduce((sum, range) => sum + range.capacity, 0);
    const take = Math.min(remainingChars, availableSlots);
    const rowTargets =
      lineOffset > 0
        ? selectLeftToRightSlots(availableRanges, take)
        : selectLineStartSlots(availableRanges, take);

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
  if (particleSystem) {
    character.emitParticles(particleSystem, dt);
    particleSystem.update(dt);
  }
  updateTextFlow(timestamp);
  drawBackground();
  drawPanel();
  if (particleSystem) {
    particleSystem.draw(ctx, panel);
  }
  drawText();
  ctx.save();
  parchmentPath(ctx, panel);
  ctx.clip();
  character.draw(ctx);
  ctx.restore();
}

function syncModalState() {
  const isOpen = !textModalEl.hidden || !configModalEl.hidden;
  document.body.classList.toggle('is-modal-open', isOpen);
  document.body.classList.toggle('is-config-open', !configModalEl.hidden);
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
  const { restoreFocus = true, commit = false } = options;

  if (isOpen) {
    setInputModalOpen(false, { restoreFocus: false });
    configSessionStartSettings = { ...settings };
    populateConfigForm(settings);
  }

  configModalEl.hidden = !isOpen;
  toggleConfigButton.setAttribute('aria-expanded', String(isOpen));
  syncModalState();

  if (isOpen) {
    fontSizeInputEl.focus();
  } else {
    if (!commit && configSessionStartSettings) {
      void applySceneSettings(configSessionStartSettings);
    }
    configSessionStartSettings = null;
  }

  if (!isOpen && restoreFocus) {
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

async function applySceneSettings(nextSettings, options = {}) {
  const { save = false } = options;
  const safeSettings = sanitizeSettings(nextSettings);
  settings = safeSettings;

  if (save) {
    saveSettings(settings);
  }

  syncCssSettings();
  const previewToken = ++configPreviewToken;
  await Promise.all([
    ensureFontLoaded(settings.fontFamily),
    ensureDevilPairSpriteLoaded(),
  ]);
  if (previewToken !== configPreviewToken) {
    return;
  }
  refreshScene();
}

function previewConfigSettings() {
  if (configModalEl.hidden) {
    return;
  }

  void applySceneSettings(readConfigForm());
}

function syncBgmSelectionUi(fileName = '未選択') {
  audioFileNameEl.textContent = fileName;
  audioClearButtonEl.hidden = fileName === '未選択';
}

function cleanupBgm() {
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.src = '';
    bgmAudio = null;
  }

  if (bgmObjectUrl) {
    URL.revokeObjectURL(bgmObjectUrl);
    bgmObjectUrl = null;
  }
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
  await applySceneSettings(readConfigForm(), { save: true });
  configSessionStartSettings = null;
  setConfigModalOpen(false, { commit: true });
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
  if (bgmAudio) {
    bgmAudio.currentTime = 0;
    void bgmAudio.play().catch(() => {});
  }
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
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
  }
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
audioFileInputEl.addEventListener('change', () => {
  const file = audioFileInputEl.files && audioFileInputEl.files[0];
  if (!file) {
    return;
  }

  cleanupBgm();
  bgmObjectUrl = URL.createObjectURL(file);
  bgmAudio = new Audio(bgmObjectUrl);
  bgmAudio.loop = true;
  bgmAudio.volume = 0.5;
  syncBgmSelectionUi(file.name);
});
audioClearButtonEl.addEventListener('click', () => {
  cleanupBgm();
  audioFileInputEl.value = '';
  syncBgmSelectionUi();
});
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
  previewConfigSettings();
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
fontSizeInputEl.addEventListener('input', () => {
  updateConfigValueLabels();
  previewConfigSettings();
});
outlineGapInputEl.addEventListener('input', () => {
  updateConfigValueLabels();
  previewConfigSettings();
});
textColorInputEl.addEventListener('input', () => {
  updateConfigValueLabels();
  previewConfigSettings();
});
fontFamilyInputEl.addEventListener('change', () => {
  updateConfigValueLabels();
  previewConfigSettings();
});
textIntervalInputEl.addEventListener('input', () => {
  updateConfigValueLabels();
  previewConfigSettings();
});
paperColorInputEl.addEventListener('input', () => {
  updateConfigValueLabels();
  previewConfigSettings();
});
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
    } else if (type === 'devil') {
      const previewWidth = Math.min(w * 0.82, h * DEVIL_PAIR_ASPECT * 0.9);
      const pm = createDevilPairGeometry(previewWidth);
      previewCtx.save();
      previewCtx.translate(w * 0.5, h * 0.52);
      drawDevilPairSprite(previewCtx, pm, { alpha: 0.95, breathPhase: 0.9 });
      previewCtx.restore();
    }
  });
}

(async () => {
  populateConfigForm(settings);
  syncCssSettings();
  const checkedRadio = document.querySelector('input[name="character"]:checked');
  selectedCharacter = checkedRadio ? checkedRadio.value : selectedCharacter;
  await Promise.all([
    ensureFontLoaded(settings.fontFamily),
    ensureDevilPairSpriteLoaded(),
  ]);
  rebuildScene();
  renderIntroFrame();
  drawCharacterPreviews();
  startButton.disabled = false;
  appInitialized = true;
})();
