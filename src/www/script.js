'use strict';

// const SERVER_URI = 'http://192.168.2.1:8000';
const SERVER_URI = 'http://home.local:80';

const socket = io(SERVER_URI);
const H = document.getElementById('H');
const S = document.getElementById('S');
const V = document.getElementById('V');

const R = document.getElementById('R');
const G = document.getElementById('G');
const B = document.getElementById('B');
const A = document.getElementById('A');

const automationToggle = document.getElementById('automationToggle');

const debug = document.getElementById('debug');
const onlineStatus = document.getElementById('onlineStatus');
const predefinedColorsContainer = document.getElementById('predefinedColorsContainer');

let brightness = A.value;

H.oninput = () => hsvRangeChangeHandler(H.value, S.value, V.value);
S.oninput = () => hsvRangeChangeHandler(H.value, S.value, V.value);
V.oninput = () => hsvRangeChangeHandler(H.value, S.value, V.value);

R.oninput = () => rgbRangeChangeHandler(R.value, G.value, B.value);
G.oninput = () => rgbRangeChangeHandler(R.value, G.value, B.value);
B.oninput = () => rgbRangeChangeHandler(R.value, G.value, B.value);
A.oninput = brightnessInputHandler;

automationToggle.onchange = () => {
  socket.emit('automationChange', automationToggle.checked);
};

function hsvRangeChangeHandler(h, s, v) {
  const [r, g, b] = hsvToRgb(h, s, v);

  socket.emit('setLed', { r , g, b });

  fadeToColor(r, g, b);
  changeBackgroundColor(r, g, b);
  updateHsvRangeBackgrounds(h, s, v);
}

function updateHsvRangeBackgrounds(h, s, v) {
  const sRgbMin = hsvToRgb(h, 0, v);
  const sRgbMax = hsvToRgb(h, 100, v);
  const sRightStyle = `rgba(${sRgbMin[0]}, ${sRgbMin[1]}, ${sRgbMin[2]}, 1)`;
  const sLeftStyle = `rgba(${sRgbMax[0]}, ${sRgbMax[1]}, ${sRgbMax[2]}, 1)`;
  S.style.background = `linear-gradient(to right, ${sRightStyle} 0%, ${sLeftStyle} 100%)`;

  const vRgb = hsvToRgb(h, s, 100);
  const vRightStyle = `rgba(0, 0, 0, 1)`;
  const vLeftStyle = `rgba(${vRgb[0]}, ${vRgb[1]}, ${vRgb[2]}, 1)`;
  V.style.background = `linear-gradient(to right, ${vRightStyle} 0%, ${vLeftStyle} 100%)`;
}

function rgbRangeChangeHandler(r, g, b,) {
  socket.emit('setLed', { r, g, b });

  setBrightness();
  changeBackgroundColor(r, g, b);
  transformRgbToHsv(r, g, b);
}

function transformRgbToHsv(r, g, b) {
  const hsv = rgbToHsv(r, g, b);
  H.value = hsv[0];
  S.value = hsv[1];
  V.value = hsv[2];
  updateHsvRangeBackgrounds(hsv[0], hsv[1], hsv[2]);
}

function brightnessInputHandler() {
  const delta = A.value - brightness;

  R.value = parseGpioValue(parseInt(R.value, 10) + delta);
  G.value = parseGpioValue(parseInt(G.value, 10) + delta);
  B.value = parseGpioValue(parseInt(B.value, 10) + delta);

  rgbRangeChangeHandler(R.value, G.value, B.value);
}

function setBrightness() {
  A.value = Math.max(R.value, G.value, B.value);
  brightness = A.value;
}

function parseGpioValue(value, max = 255) {
  const i = parseInt(value, 10);
  return Math.min(Math.max(i, 0), max);
}

function addPredefinedColors(predefinedColors) {
  predefinedColorsContainer.innerHTML = '';

  predefinedColors.forEach(rgb => {
    const btn = document.createElement('button');

    btn.classList.add('color');
    btn.style.background = getColorGradient(rgb[0], rgb[1], rgb[2], true);

    btn.addEventListener('click', function() {
      fadeToColor(rgb[0], rgb[1], rgb[2]);
      rgbRangeChangeHandler(rgb[0], rgb[1], rgb[2]);
    });

    predefinedColorsContainer.appendChild(btn);
  });
}

function addPredefinedScenes(predefinedScenes) {
  predefinedScenes.forEach(scene => {
    const btn = document.createElement('button');

    btn.classList.add('color');
    btn.style.background = getMultiColorGradient(scene);

    btn.addEventListener('click', () => {
      // call animate function
      socket.emit('setScene', scene);
      document.body.style.background = getMultiColorGradient(scene);
    });

    predefinedColorsContainer.appendChild(btn);
  });
}

function getMultiColorGradient(colors) {
  const gradients = [];
  colors.forEach(color => {
    gradients.push(getColorGradient(color[0], color[1], color[2]));
  });

  return `linear-gradient(to bottom, ${gradients.join(',')})`;
}

function getColorGradient(r, g, b, gradient) {
  const gradientModifier = 60;
  const bottomR = parseGpioValue(r - gradientModifier);
  const bottomG = parseGpioValue(g - gradientModifier);
  const bottomB = parseGpioValue(b - gradientModifier);

  const topStyle = `rgba(${r}, ${g}, ${b}, 1)`;
  const bottomStyle = `rgba(${bottomR}, ${bottomG}, ${bottomB}, 1)`;

  if(gradient) {
    return `linear-gradient(to bottom, ${topStyle} 0%, ${bottomStyle} 100%)`;
  }

  return `rgb(${r}, ${g}, ${b})`;
}

document.getElementById('addColorScene').addEventListener('click', function() {
  socket.emit('setPredefinedColor', [R.value, G.value, B.value]);
});


let rRangeAnimation = { stop: () => {} };
let gRangeAnimation = { stop: () => {} };
let bRangeAnimation = { stop: () => {} };

function fadeToColor(r, g, b, inputSpeed) {
  const duration = inputSpeed || 1000;

  rRangeAnimation.stop();
  gRangeAnimation.stop();
  bRangeAnimation.stop();

  const rCurrent = parseGpioValue(R.value);
  const gCurrent = parseGpioValue(G.value);
  const bCurrent = parseGpioValue(B.value);

  rRangeAnimation = popmotion.tween({
    from: rCurrent,
    to: parseGpioValue(r),
    ease: { x: popmotion.easing.easeOut, y: popmotion.easing.easeIn },
    duration
  }).start(v => {
    R.value = parseGpioValue(v.x);
    setBrightness();
  });

  gRangeAnimation = popmotion.tween({
    from: gCurrent,
    to: parseGpioValue(g),
    ease: { x: popmotion.easing.easeOut, y: popmotion.easing.easeIn },
    duration
  }).start(v => {
    G.value = parseGpioValue(v.x);
    setBrightness();
  });

  bRangeAnimation = popmotion.tween({
    from: bCurrent,
    to: parseGpioValue(b),
    ease: { x: popmotion.easing.easeOut, y: popmotion.easing.easeIn },
    duration
  }).start(v => {
    B.value = parseGpioValue(v.x);
    setBrightness();
  });

  changeBackgroundColor(r, g, b, duration);
}

let backgroundColorAnimation  = { stop: () => {} };
function changeBackgroundColor(r, g, b, duration) {
  backgroundColorAnimation.stop();
  const bodyElement = popmotion.styler(document.querySelector('body'));

  const fromBg = getColorGradient(R.value, G.value, B.value);
  const toBg = getColorGradient(r, g, b);

  backgroundColorAnimation = popmotion.keyframes({
    values: [{ background: fromBg }, { background: toBg }],
    duration: duration || 1000,
    easings: [
      popmotion.easing.easeInOut,
      popmotion.easing.easeInOut,
      popmotion.easing.easeInOut,
      popmotion.easing.easeInOut
    ]
  }).start(v => {
    const rgbRegex = /rgba\((\d+),?\s(\d+),?\s(\d+),?\s(\d+)\)/i;
    const rgb = v.background.match(rgbRegex);
    bodyElement.set({
      background: getColorGradient(rgb[1], rgb[2], rgb[3], true)
    });
  });
}

socket.on('change', function(msg) {
  automationToggle.checked = msg.automationEnabled;

  fadeToColor(msg.ledStrip.r, msg.ledStrip.g, msg.ledStrip.b);
  transformRgbToHsv(msg.ledStrip.r, msg.ledStrip.g, msg.ledStrip.b);

  debug.innerHTML = JSON.stringify(msg);

  addPredefinedColors(msg.predefinedColors);
  addPredefinedScenes(msg.predefinedScenes);
  setBrightness();

  const latMotionDetected = moment(msg.motionDetectedDate).fromNow();
  onlineStatus.innerText = `${msg.clientsCount} connected client${msg.clientsCount > 1 ? 's' : ''} \n motion detected ${latMotionDetected}`;
});

const cpuTemp = document.getElementById('cpuTemp');
socket.on('cpuTemp', function(temp) {
  cpuTemp.innerHTML = `${temp}&deg;C`;
});

let isFirstConnect = true;
socket.on('connect', () => {
  const container = document.getElementById('container');

  container.classList.add('connected');
  onlineStatus.innerText = 'Connected';

  if (isFirstConnect === false) {
    // reload page if it was already open during server restart
    location.reload();
  }

  isFirstConnect = false;
});

socket.on('disconnect', () => {
  onlineStatus.innerText = 'Disconnected...';
  container.classList.remove('connected');
});

socket.on('error', function(err) {
  console.log('received socket error:');
  console.log(err);
  onlineStatus.innerText = 'Socket error...';
});

if (window.navigator.standalone === false) {
  // todo: write logic to show a dialog
  console.log('not STANDALONE APP..');
}
