'use strict';

const Gpio = require('pigpio').Gpio;

class MotionDetector {

  constructor(gpioPin, noMotionGracePeriod) {
    this._noMotionGracePeriod = noMotionGracePeriod;
    this._motionDetector = new Gpio(gpioPin, { mode: Gpio.INPUT, alert: true });
    this._motionDetected = false;
    this._nonMotionTimeout = null;
  }

  detect() {
    this._motionDetector.on('alert', this._motionHandler.bind(this));
  }

  setEventCallbacks(eventCallbacks) {
    this._eventCallbacks = eventCallbacks;
    return this;
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
    this._eventCallbacks.motionDetected();
  }

  _handleNonMotion() {
    this._nonMotionTimeout = setTimeout(this._nonMotionDetectedEvent.bind(this), this._noMotionGracePeriod);
  }

  _nonMotionDetectedEvent() {
    this._motionDetected = false;
    this._eventCallbacks.noMotionDetected();
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
