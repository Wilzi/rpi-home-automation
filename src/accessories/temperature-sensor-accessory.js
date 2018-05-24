'use strict';

const AccessorySuper = require('./accessory-super');
const config = require('../config');

class TemperatureSensorAccessory extends AccessorySuper {

  _setup() {
    this._addEventListenerGet();
    this._addEventListenerChange();
  }

  _addEventListenerGet() {
    this._accessory
      .addService(this._service.TemperatureSensor, this._settings.name)
      .getCharacteristic(this._characteristic.CurrentTemperature)
      .on('get', callback => {
        this._controller.getCpuTemp().then(temp => {
          callback(null, temp);
        });
      });
  }

  _addEventListenerChange() {
    setInterval(() => {
      this._controller.getCpuTemp().then(this._emitChange);
    }, config.CPU_TEMP_BROADCAST_INTERVAL);
  }

  _emitChange(state) {
    this._accessory
      .getService(this._service.TemperatureSensor)
      .getCharacteristic(this._characteristic.CurrentTemperature)
      .updateValue(state);
  }

  static create(settings) {
    return new TemperatureSensorAccessory(settings);
  }
}

module.exports = TemperatureSensorAccessory;
