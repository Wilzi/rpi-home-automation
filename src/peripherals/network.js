'use strict';

const _ = require('lodash');
const findLocalDevices = require('local-devices');

// https://github.com/bencevans/node-arp-listener
// https://www.npmjs.com/package/local-devices

// https://itsfoss.com/how-to-find-what-devices-are-connected-to-network-in-ubuntu/
// https://www.npmjs.com/package/node-nmap

class Network {

  constructor() {
    this._inRangeDevices = {};
  }

  scan() {
    this._log('start scanning...');
    findLocalDevices().then(devices => {
//      console.log(devices);

      const diff = _.differenceBy(devices, this._inRangeDevices, 'mac');
      this._inRangeDevices = devices.map(d => {
        d.lastSeen = new Date();
        return d;
      });

      console.log(diff, 'diff');

//      devices.forEach(device => {
////        console.log(device);
//
//        if (this._isEntered(device.mac)) {
//          this._log('"' + device.name + '" entered' + new Date());
////          this._eventCallbacks.deviceConnected(device);
//        }
//
//        this._saveInRageDevice(device);
//      });

      this.scan();
    });
  }

  stop() {
    this._inRangeDevices = {};

    if (this._scanInterval) {
      clearInterval(this._scanInterval);
    }
  }

  _isEntered(deviceId) {
    return !this._inRangeDevices[deviceId];
  }

  _saveInRageDevice(deviceMetaData) {
    this._inRangeDevices[deviceMetaData.mac] = Object.assign({}, deviceMetaData, { lastSeen: Date.now() });
  }


  _log(string) {
    console.log(`[NETWORK-SCANNER] ${string}`);
  }

  static create() {
    return new Network();
  }
}

const network = Network.create();
network.scan();


module.exports = Network;
