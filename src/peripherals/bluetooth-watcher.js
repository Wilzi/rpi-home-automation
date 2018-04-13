'use strict';

const Rx = require('rx');
const _ = require('lodash');
const noble = require('noble');
const Events = require('./events');

// Todo
// - [ ] Use RSSI Threshold to determinate device distance
// - [ ] log all discovered devices

class BluetoothWatcher extends Events {

  constructor(addresses, exitGracePeriod) {
    super();

    this._exitGracePeriod = exitGracePeriod;
    this._addresses = addresses;
    this._outOfRangeInterval = null;
    this._inRangeDevices = {};
    this._columns = [
      'id',
      'uuid',
      'address',
      'addressType',
      'connectable',
      'advertisement',
      'serviceData',
      'serviceUuids',
      'rssi',
      'services',
      'state'
    ];
  }


  _initEvents() {
    this._events = {
      deviceConnected: new Rx.Subject(),
      deviceDisconnected: new Rx.Subject(),
      allDevicesDisconnected: new Rx.Subject()
    };
  }


  scan() {
    noble.on('stateChange', this._onStateChangeHandler.bind(this));
    noble.on('discover', this._onDiscoverHandler.bind(this));
  }


  stop() {
    noble.stopScanning();
    this._inRangeDevices = {};

    if (this._outOfRangeInterval) {
      clearInterval(this._outOfRangeInterval);
    }
  }


  isDeviceConnected() {
    return Object.keys(this._inRangeDevices).length > 0
  }


  _onStateChangeHandler(state) {
    if (state === 'poweredOn') {
      noble.startScanning([], true);
      this._startOutOfRangeChecker();
      this._log('Scanning started...');
      return;
    }

    noble.stopScanning();
    this._log('Scanning stopped.');
  }


  _onDiscoverHandler(peripheral) {
    const device = _.pick(peripheral, this._columns);

    if (!this._isKnownAddress(device.address)) {
      // todo emit unknown BT device found event
      return;
    }

    if (this._isEntered(device.id)) {
      this._log('"' + device.advertisement.localName + '" entered (RSSI ' + device.rssi + ') ' + new Date());
      this._events.deviceConnected.onNext(device);
    }

    this._saveInRageDevice(device);
  }


  _startOutOfRangeChecker() {
    this._outOfRangeInterval = setInterval(this._outOfRangeHandler.bind(this), this._exitGracePeriod / 2);
  }


  _outOfRangeHandler() {
    const numberOfDevicesBeforeCleanup = Object.keys(this._inRangeDevices).length;

    for (let id in this._inRangeDevices) {
      const device = this._inRangeDevices[id];

      if (this._isDeviceOutOfRange(device)) {
        this._log('"' + device.advertisement.localName + '" exited (RSSI ' + device.rssi + ') ' + new Date());
        this._events.deviceDisconnected.onNext(device);
        delete this._inRangeDevices[id];
      }
    }

    if (this._isAllDevicesDisconnected(numberOfDevicesBeforeCleanup)) {
      this._log('All devices has been disconnected!');
      this._events.allDevicesDisconnected.onNext();
    }
  }


  _isAllDevicesDisconnected(numberOfDevicesBeforeCleanup) {
    return numberOfDevicesBeforeCleanup > 0 && Object.keys(this._inRangeDevices).length === 0;
  }


  _isDeviceOutOfRange(device) {
    return device.lastSeen < (Date.now() - this._exitGracePeriod);
  }


  _isKnownAddress(address) {
    return _.indexOf(this._addresses, address) > -1
  }


  _isEntered(deviceId) {
    return !this._inRangeDevices[deviceId];
  }


  _saveInRageDevice(deviceMetaData) {
    this._inRangeDevices[deviceMetaData.id] = Object.assign({}, deviceMetaData, { lastSeen: Date.now() });
  }


  _log(event) {
    // console.log(event);
  }

  static create(addresses, exitGracePeriod) {
    return new BluetoothWatcher(addresses, exitGracePeriod);
  }
}

module.exports = BluetoothWatcher;
