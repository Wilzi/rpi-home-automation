'use strict';

const AccessorySuper = require('./accessory-super');

class MotionSensorAccessory extends AccessorySuper {

  _setup() {
    this._addEventListenerGet();
    this._addEventListenerChange();
  }

  _addEventListenerGet() {
    this._accessory
      .addService(this._service.MotionSensor, this._settings.name)
      .getCharacteristic(this._characteristic.MotionDetected)
      .on('get', callback => {
        callback(null, this._controller.isMotionDetected());
      });
  }

  _addEventListenerChange() {
    this._controller.getEvent('motionDetected').subscribe(() => {
      this._emitChange(true);
    });

    this._controller.getEvent('noMotionDetected').subscribe(() => {
      this._emitChange(false);
    });
  }

  _emitChange(state) {
    this._accessory
      .getService(this._service.MotionSensor)
      .getCharacteristic(this._characteristic.MotionDetected)
      .updateValue(state);
  }

  static create(settings) {
    return new MotionSensorAccessory(settings);
  }
}

module.exports = MotionSensorAccessory;
