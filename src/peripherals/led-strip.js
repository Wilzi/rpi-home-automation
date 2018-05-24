'use strict';

const colorConvert = require('color-convert');
const Led = require('./led');
const popmotion = require('popmotion');

class LedStrip {

  constructor({ redPin, greenPin, bluePin }) {
    this._R = Led.create(redPin);
    this._G = Led.create(greenPin);
    this._B = Led.create(bluePin);

    this._actualAnimation = null;
  }

  isTurnedOn() {
    return this._getMaxSignal() !== 0;
  }

  stop() {
    this.stopAnimation();

    this._R.stop();
    this._G.stop();
    this._B.stop();
  }

  turnOff() {
    this.stopAnimation();

    this._R.turnOff();
    this._G.turnOff();
    this._B.turnOff();
  }

  pulse(speed) {
    const diff = Math.max(this._getMaxSignal() / 2, 10);

    return {
      r: this._R.pulse(diff, speed),
      g: this._G.pulse(diff, speed),
      b: this._B.pulse(diff, speed)
    }
  }

  setSignal(r, g, b) {
    return [
      this._R.setSignal(r),
      this._G.setSignal(g),
      this._B.setSignal(b)
    ]
  }

  getSignal() {
    return {
      r: this._R.getSignal(),
      g: this._G.getSignal(),
      b: this._B.getSignal()
    }
  }

  setSignalHsv(h, s, v) {
    const rgb = colorConvert.hsv.rgb(h, s, v);
    return this.setSignal(...rgb);
  }

  getSignalHsv() {
    return colorConvert.rgb.hsv(this._R.getSignal(), this._G.getSignal(), this._B.getSignal());
  }

  setBrightness(value) {
    const hsv = this.getSignalHsv();
    return this.fadeToColorHsv(hsv[0], hsv[1], value, 500);
  }

  getBrightness() {
    const hsv = this.getSignalHsv();
    return hsv[2];
  }

  setSaturation(value) {
    const hsv = this.getSignalHsv();
    return this.setSignalHsv(hsv[0], value, hsv[2]);
  }

  getSaturation() {
    const hsv = this.getSignalHsv();
    return hsv[1];
  }

  setHue(value) {
    const hsv = this.getSignalHsv();
    return this.fadeToColorHsv(value, hsv[1], hsv[2], 500);
  }

  getHue() {
    const hsv = this.getSignalHsv();
    return hsv[0];
  }

  stopAnimation() {
    if (this._actualAnimation) {
      this._actualAnimation.stop();
    }

    this._R.stopAnimation();
    this._G.stopAnimation();
    this._B.stopAnimation();
  }

  // todo fade to first color before start
  fadeBetween(fadeColors, duration, yoyo) {
    this.stopAnimation();

    const values = [];
    fadeColors.forEach(rgb => {
      values.push({ background: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` })
    });

    this._actualAnimation = popmotion.keyframes({
      values,
      duration: duration || 1000,
      easings: [popmotion.easing.easeInOut, popmotion.easing.easeInOut, popmotion.easing.easeInOut, popmotion.easing.easeInOut],
      yoyo: yoyo || Infinity
    }).start(v => {
      const rgbRegex = /rgba\((\d+),?\s(\d+),?\s(\d+),?\s(\d+)\)/i;
      const rgb = v.background.match(rgbRegex);
      this.setSignal(rgb[1], rgb[2], rgb[3]);
    });
  }

  fadeToColor(r, g, b, duration) {
    this.stopAnimation();

    return Promise.all([
      this._R.fadeToColor(r, duration),
      this._G.fadeToColor(g, duration),
      this._B.fadeToColor(b, duration)
    ]);
  }

  fadeToColorHsv(h, s, v, duration) {
    const rgb = colorConvert.hsv.rgb(h, s, v);
    return this.fadeToColor(...rgb, duration);
  }

  fadeInToColor(r, g, b, duration) {
    if (!this.isTurnedOn()) {
      this.fadeToColor(r, g, b, duration);
    }
  }

  fadeInToColorHsv(h, s, v, duration) {
    if (!this.isTurnedOn()) {
      const rgb = colorConvert.hsv.rgb(h, s, v);
      this.fadeToColor(...rgb, duration);
    }
  }

  _getMaxSignal() {
    return Math.max(this._R.getSignal(), this._G.getSignal(), this._B.getSignal());
  }

  static create(pins) {
    return new LedStrip(pins);
  }
}

module.exports = LedStrip;
