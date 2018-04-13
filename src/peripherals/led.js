'use strict';

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
    if (this._actualSignal === MAX_SIGNAL) {
      return;
    }

    const interval = setInterval(() => {
      this._led.pwmWrite(this._actualSignal);

      this._actualSignal += 5;
      if (this._actualSignal >= MAX_SIGNAL) {
        this._actualSignal = MAX_SIGNAL;
        clearInterval(interval);
      }
    }, FADE_SPEED);
  }

  fadeOut() {
    if (this._actualSignal === MIN_SIGNAL) {
      return;
    }

    const interval = setInterval(() => {
      this._led.pwmWrite(this._actualSignal);

      this._actualSignal -= 5;
      if (this._actualSignal <= MIN_SIGNAL) {
        this._actualSignal = MIN_SIGNAL;
        clearInterval(interval);
      }
    }, FADE_SPEED);
  }

  blink() {
    const blinkInterval = setInterval(() => {
      this._led.writeSync(this._led.readSync() ^ 1);
    }, 150);

    setTimeout(() => {
      clearInterval(blinkInterval);
      this.turnOff();
    }, 5000);
  }

  static create(pin) {
    return new Led(pin);
  }
}

module.exports = Led;
