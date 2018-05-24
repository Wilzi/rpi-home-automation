'use strict';

// brew install nmap
// OR
// sudo apt-get install nmap

const Rx = require('rx');
const _ = require('lodash');
const nmap = require('node-nmap');
const Events = require('../lib/events');

class NmapScan extends Events {
  constructor(ipRange = '', addresses = [], exitGracePeriod = 60000) {
    super();

    this._ipRange = ipRange;
    this._addresses = addresses;
    this._exitGracePeriod = exitGracePeriod;
    this._connectedDevices = {};
  }

  _initEvents() {
    this._events = {
      deviceConnected: new Rx.Subject(),
      deviceDisconnected: new Rx.Subject(),
      allDevicesDisconnected: new Rx.Subject(),
      unknownDeviceDiscovered: new Rx.Subject()
    };
  }

  scan() {
    this._scanner = new nmap.QuickScan(this._ipRange);
    this._subscribeForEvents();
    this._scanner.startScan();
    this._startOutOfRangeChecker();
  }

  isDeviceConnected() {
    return Object.keys(this._connectedDevices).length > 0;
  }

  _subscribeForEvents() {
    this._scanner.on('complete', this._scanHandler.bind(this));
    this._scanner.on('error', this._errorHandler.bind(this));
  }

  _scanHandler(devices) {
    devices = _.filter(devices, d => _.indexOf(this._addresses, d.mac) > -1);
    
    const newDevices = [];
    
    devices
      .map(device => Object.assign(device, { lastSeen: Date.now() }))
      .map(device => {
        const mac = device.mac
        if (mac) {
          if (!this._connectedDevices[mac]) {
            // console.log(`entered: IP: ${device.ip} MAC: ${mac} ${new Date()}`);
            this._events.deviceConnected.onNext(device);
          }
          
          newDevices[mac] = device;
        }
      });

    this._connectedDevices = Object.assign({}, this._connectedDevices, newDevices);

    this.scan();
  }

  _startOutOfRangeChecker() {
    this._outOfRangeInterval = setInterval(this._outOfRangeHandler.bind(this), this._exitGracePeriod);
  }

  _outOfRangeHandler() {
    const numberOfDevicesBeforeCleanup = Object.keys(this._connectedDevices).length;

    for (let mac in this._connectedDevices) {
      const device = this._connectedDevices[mac];

      if (this._isDeviceOutOfRange(device)) {
        // console.log(`exited: IP: ${device.ip} MAC: ${device.mac} ${new Date()}`);
        this._events.deviceDisconnected.onNext(device);
        delete this._connectedDevices[mac];
      }
    }

    if (this._isAllDevicesDisconnected()) {
        this._events.allDevicesDisconnected.onNext(true);
    }
  }


  _isAllDevicesDisconnected(numberOfDevicesBeforeCleanup) {
    return Object.keys(this._connectedDevices).length === 0 && numberOfDevicesBeforeCleanup > 0;
  }


  _isDeviceOutOfRange(device) {
    return device.lastSeen < (Date.now() - this._exitGracePeriod);
  }

  _errorHandler(error) {
    console.log(error, 'NmapScannerError');
  }

  static create(ipRange, addresses, exitGracePeriod) {
    return new NmapScan(ipRange, addresses, exitGracePeriod);
  }
}

module.exports = NmapScan;
