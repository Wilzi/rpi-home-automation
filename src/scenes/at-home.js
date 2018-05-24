'use strict';

const Rx = require('rx');
const Events = require('../lib/events');

class atHome extends Events {

  constructor(motion, bluetooth, network) {
    super();

    this.motion = motion;
    this.bluetooth = bluetooth;
    this.network = network;
  }

  _initEvents() {
    this._events = {
      deviceConnected: new Rx.Subject(),
      allDevicesDisconnected: new Rx.Subject()
    };
  }

  start() {
    this.motion.getEvent('motionDetected').subscribe(this._eventHandler.bind(this));
    this.motion.getEvent('noMotionDetected').subscribe(this._eventHandler.bind(this));

    this.bluetooth.getEvent('deviceConnected').subscribe(this._eventHandler.bind(this));
    this.bluetooth.getEvent('deviceDisconnected').subscribe(this._eventHandler.bind(this));
    this.bluetooth.getEvent('allDevicesDisconnected').subscribe(this._eventHandler.bind(this));

    this.network.getEvent('deviceConnected').subscribe(this._eventHandler.bind(this));
    this.network.getEvent('allDevicesDisconnected').subscribe(this._eventHandler.bind(this));
  }

  isDeviceConnected() {
    return this.motion.isMotionDetected() || this.bluetooth.isDeviceConnected() || this.network.isDeviceConnected();
  }

  _eventHandler() {
    if (this.isDeviceConnected()) {
      this._events.deviceConnected.onNext(true);
      return;
    }

    this._events.allDevicesDisconnected.onNext(false);
  }

  static create(...args) {
    return new atHome(...args);
  }
}

module.exports = atHome;
