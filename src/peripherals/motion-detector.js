'use strict';

const Rx = require('rx');
const Gpio = require('pigpio').Gpio;
const Events = require('./events');

class MotionDetector extends Events {

  constructor(gpioPin, noMotionGracePeriod) {
    super();

    this._noMotionGracePeriod = noMotionGracePeriod;
    this._motionDetector = new Gpio(gpioPin, { mode: Gpio.INPUT, alert: true });
    this._motionDetected = false;
    this._nonMotionTimeout = null;
  }

  _initEvents() {
    this._events = {
      motionDetected: new Rx.Subject(),
      noMotionDetected: new Rx.Subject()
    };
  }

  detect() {
    this._motionDetector.on('alert', this._motionHandler.bind(this));
  }

  // todo should return with a promise
  // should wait for motion sensor to heat up!
  isMotionDetected() {
    return this._motionDetected;
  }

  _motionHandler(value) {
    if (value) {
      this._handleMotion();
      return;
    }

    this._handleNonMotion();
  }

  _handleMotion() {
    this._clearNonMotionTimeout();

    if (this._motionDetected) {
      return;
    }

    this._motionDetected = true;
    this._events.motionDetected.onNext();
  }

  _handleNonMotion() {
    this._nonMotionTimeout = setTimeout(this._nonMotionDetectedEvent.bind(this), this._noMotionGracePeriod);
  }

  _nonMotionDetectedEvent() {
    this._motionDetected = false;
    this._events.noMotionDetected.onNext();
  }

  _clearNonMotionTimeout() {
    if (this._nonMotionTimeout) {
      clearTimeout(this._nonMotionTimeout);
    }
  }

  static create(gpioPin, noMotionGracePeriod) {
    return new MotionDetector(gpioPin, noMotionGracePeriod);
  }
}

module.exports = MotionDetector;
