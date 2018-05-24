'use strict';

const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;

class AccessorySuper {

  constructor(settings) {
    this._settings = settings;
    this._controller = settings.controller;
    
    this._service = Service;
    this._characteristic = Characteristic;
    this._UUID = uuid.generate(`hap-nodejs:accessories:${this._settings.name}`);
    this._accessory = new Accessory(this._settings.name, this._UUID);
  }

  getAccessory() {
    if (!this._controller) {
      throw new Error('Missing settings.controller argument...');
    }

    this._setBasicInformation();
    this._addEventListenerIdentify();
    this._setup();

    return this._accessory;
  }

  _setBasicInformation() {
    this._accessory.username = this._settings.username;
    this._accessory.pincode = this._settings.pincode;

    this._accessory
      .getService(this._service.AccessoryInformation)
      .setCharacteristic(this._characteristic.Manufacturer, this._settings.manufacturer)
      .setCharacteristic(this._characteristic.Model, this._settings.model)
      .setCharacteristic(this._characteristic.SerialNumber, this._settings.serialNumber);
  }

  _addEventListenerIdentify() {
    this._accessory.on('identify', (paired, callback) => {
      this._log(`Identify the ${this._settings.name}`);
      callback();
    });
  }

  _log(text) {
    console.log(text);
  }

  _setup() {
    throw new Error('_setup method needs to be implemented in child class');
  }
}

module.exports = AccessorySuper;
