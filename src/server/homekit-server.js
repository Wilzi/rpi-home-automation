'use strict';

const path = require('path');
const storage = require('node-persist');
const accessoryLoader = require('hap-nodejs').AccessoryLoader;

class HomekitServer {

  constructor(accessories = []) {
    this._accessories = accessories;
    this._targetPort = 51826;
  }

  start() {
    console.log('HomeKit Server starting...');
    storage.initSync();
    this._loadAccessories();
  }

  _loadAccessories() {
    this._accessories.forEach(accessorySettings => {
      // todo validate accessory file
      const path = `../accessories/${accessorySettings.type}-accessory`;
      const accessory = require(path).create(accessorySettings).getAccessory();
      this._validateAccessory(accessory);
      this._publishAccessoryOnTheLocalNetwork(accessory);
      console.log(`${accessory.displayName}'s pin code: ${accessory.pincode}`);
    });
  }

  _validateAccessory(accessory) {
    if (!accessory.username) {
      throw new Error(`Username not found on accessory '${accessory.displayName}'`);
    }

    if (!accessory.pincode) {
      throw new Error(`Pincode not found on accessory '${accessory.displayName}'`);
    }
  }

  _publishAccessoryOnTheLocalNetwork(accessory) {
    accessory.publish({
      port: this._targetPort++,
      username: accessory.username,
      pincode: accessory.pincode
    });
  }

  static create(accessories) {
    return new HomekitServer(accessories);
  }
}

module.exports = HomekitServer;
