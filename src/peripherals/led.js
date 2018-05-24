'use strict';

const q = require('q');
const Gpio = require('pigpio').Gpio;
const popmotion = require('popmotion');

const FADE_SPEED = 10;
const MIN_SIGNAL = 0;
const MAX_SIGNAL = 255;

class Led {

  constructor(pin) {
    this._led = new Gpio(pin, 'out');
    this._actualSignal = MIN_SIGNAL;
    this._actualAnimation = null;
  }

  isTurnedOn() {
    return this._actualSignal !== MIN_SIGNAL;
  }

  setSignal(signal) {
    this._actualSignal = this._validateSignal(signal);
    this._led.pwmWrite(this._actualSignal);
  }

  setBrightness(value, duration) {
    const signal = Math.round(value / 100 * MAX_SIGNAL);
    return this.fadeToColor(value, duration);
  }

  getBrightness() {
    return Math.round(this.getSignal() / 100 * MAX_SIGNAL);
  }

  getSignal() {
    return this._actualSignal;
  }

  // unexport GPIO and free resources
  stop() {
    this.turnOff();
    this._led.unexport();
  }

  turnOn() {
    this._led.digitalWrite(1);
    this._actualSignal = MAX_SIGNAL;
  }

  turnOff() {
    this._led.digitalWrite(0);
    this._actualSignal = MIN_SIGNAL;
  }

  stopAnimation() {
    if (this._actualAnimation) {
      this._actualAnimation.stop();
    }
  }

  pulse(diff = 100, speed = 1000) {
    const prev = this._actualSignal;
    const signal = this._validateSignal(this._actualSignal - diff);

    this.fadeToColor(signal, speed);
    setTimeout(() => {
      this.fadeToColor(prev, speed);
    }, speed);

  }

  fadeToColor(inputSignal, duration = 2000, loop = false) {
    const deferred = q.defer();
    this.stopAnimation();

    const to = this._validateSignal(inputSignal);

    this._actualAnimation = popmotion.tween({
      from: this._actualSignal,
      to,
      duration,
      loop,
      ease: { x: popmotion.easing.easeInOut, y: popmotion.easing.easeInOut }
    }).start(v => {
      const signal = this._validateSignal(v.x);
      this.setSignal(signal);

      if (this._actualSignal === to) {
        deferred.resolve(this._actualAnimation);
      }
    });

    return deferred.promise;
  }

  _fadeToColor(inputSignal, speed = FADE_SPEED) {
    const deferred = q.defer();
    const signal = this._validateSignal(inputSignal);
    const delta = this._actualSignal - signal;

    if (delta === 0) {
      deferred.resolve(this._actualSignal);
      return deferred.promise;
    }

    const interval = setInterval(() => {
      if (delta < 0) {
        this._actualSignal = this._validateSignal(this._actualSignal+1);
        this._led.pwmWrite(this._actualSignal);

        if (this._actualSignal >= signal) {
          this._actualSignal = signal;
          deferred.resolve(this._actualSignal);
          clearInterval(interval);
        }
      } else {
        this._actualSignal = this._validateSignal(this._actualSignal-1);
        this._led.pwmWrite(this._actualSignal);

        if (this._actualSignal <= signal) {
          this._actualSignal = signal;
          deferred.resolve(this._actualSignal);
          clearInterval(interval);
        }
      }
    }, speed);

    return deferred.promise;
  }

  fadeIn(duration = FADE_SPEED) {
    const deferred = q.defer();

    if (this._actualSignal === MAX_SIGNAL) {
      deferred.resolve(this._actualSignal);
      return deferred.promise;
    }

    const interval = setInterval(() => {
      this._led.pwmWrite(this._actualSignal);

      this._actualSignal += 5;
      if (this._actualSignal >= MAX_SIGNAL) {
        this._actualSignal = MAX_SIGNAL;
        deferred.resolve(this._actualSignal);
        clearInterval(interval);
      }
    }, duration);

    return deferred.promise;
  }

  fadeOut(duration = FADE_SPEED) {
    const deferred = q.defer();

    if (this._actualSignal === MIN_SIGNAL) {
      return;
    }

    const interval = setInterval(() => {
      this._led.pwmWrite(this._actualSignal);

      this._actualSignal -= 5;
      if (this._actualSignal <= MIN_SIGNAL) {
        this._actualSignal = MIN_SIGNAL;
        deferred.resolve(this._actualSignal);
        clearInterval(interval);
      }
    }, duration);

    return deferred.promise;
  }

  blink(speed = 150, duration = 5000) {
    const deferred = q.defer();

    const blinkInterval = setInterval(() => {
      this._led._actualSignal = this._actualSignal === MIN_SIGNAL ? MAX_SIGNAL : MIN_SIGNAL;
      this._led.pwmWrite(this._actualSignal);
    }, speed);

    setTimeout(() => {
      clearInterval(blinkInterval);
      deferred.resolve(this._actualSignal);
      this.turnOff();
    }, duration);

    return deferred.promise;
  }

  _validateSignal(signal) {
    return Math.min(Math.max(parseInt(signal, 10), MIN_SIGNAL), MAX_SIGNAL);
  }

  static create(pin) {
    return new Led(pin);
  }
}

module.exports = Led;
