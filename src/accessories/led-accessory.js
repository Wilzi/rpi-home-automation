'use strict';

const AccessorySuper = require('./accessory-super');

class LedAccessory extends AccessorySuper {

  _setup() {
    this._addEventListenerOnOff();
    this._addEventListenerBrightness();
  }

  _addEventListenerOnOff() {
    this._accessory
      .addService(this._service.Lightbulb, this._settings.name)
      .getCharacteristic(this._characteristic.On)
      .on('set', (powerValue, callback) => {
        if (powerValue) {
          if (!this._controller.isTurnedOn()) {
            this._controller.fadeToColor(255, 500);
            this._log(`Turn ${this._settings.name} lamp ON`);
          }
        } else {
          this._controller.fadeToColor(0, 500);
          this._log(`Turn ${this._settings.name} lamp OFF`);
        }
        callback();
      })
      .on('get', callback => {
        callback(null, this._controller.isTurnedOn());
      });
  }

  _addEventListenerBrightness() {
    this._accessory
      .getService(this._service.Lightbulb)
      .addCharacteristic(this._characteristic.Brightness)
      .on('set', (value, callback) => {
        this._controller.setBrightness(value, 500);
        this._log(`Set ${this._settings.name}'s brightness: ${value}`);
        callback();
      })
      .on('get', callback => {
        callback(null, this._controller.getBrightness());
      });
  }

  static create(settings) {
    return new LedAccessory(settings);
  }
}

module.exports = LedAccessory;
