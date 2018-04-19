'use strict';

const q = require('q');
const Gpio = require('pigpio').Gpio;

const FADE_SPEED = 20;
const MIN_SIGNAL = 0;
const MAX_SIGNAL = 255;

class Led {

  constructor(pin) {
    this._led = new Gpio(pin, 'out');
    this._actualSignal = MIN_SIGNAL;
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

  fadeIn() {
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
    }, FADE_SPEED);

    return deferred.promise;
  }

  fadeOut() {
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
    }, FADE_SPEED);

    return deferred.promise;
  }

  blink() {
    const deferred = q.defer();

    const blinkInterval = setInterval(() => {
      this._led._actualSignal = this._actualSignal === MIN_SIGNAL ? MAX_SIGNAL : MIN_SIGNAL;
      this._led.pwmWrite(this._actualSignal);
    }, 150);

    setTimeout(() => {
      clearInterval(blinkInterval);
      deferred.resolve(this._actualSignal);
      this.turnOff();
    }, 5000);

    return deferred.promise;
  }

  static create(pin) {
    return new Led(pin);
  }
}

module.exports = Led;
