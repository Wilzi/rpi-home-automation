'use strict';

const AccessorySuper = require('./accessory-super');

class LedStripAccessory extends AccessorySuper {

  _setup() {
    this._addEventListenerOnOff();
    this._addEventListenerBrightness();
    this._addEventListenerSaturation();
    this._addEventListenerHue();
  }

  _addEventListenerOnOff() {
    this._accessory
      .addService(this._service.Lightbulb, this._settings.name)
      .getCharacteristic(this._characteristic.On)
      .on('set', (power, callback) => {
        this._setPower(power);
        callback();
      })
      .on('get', callback => {
        callback(null, this._controller.isTurnedOn());
      });
  }

  _setPower(power) {
    if (power) {
      const hsv = this._controller.getSignalHsv();
      this._controller.fadeInToColorHsv(hsv[0], hsv[1], 100, 500);
      this._log(`Turn ${this._settings.name} ON`);
    } else {
      this._controller.setBrightness(0);
      this._log(`Turn ${this._settings.name} OFF`);
    }
  }

  _addEventListenerBrightness() {
    this._accessory
      .getService(this._service.Lightbulb)
      .addCharacteristic(this._characteristic.Brightness)
      .on('set', (value, callback) => {
        this._controller.setBrightness(value);
        this._log(`Set ${this._settings.name}'s brightness: ${value}`);
        callback();
      })
      .on('get', callback => {
        callback(null, this._controller.getBrightness());
      });
  }

  _addEventListenerSaturation() {
    this._accessory
      .getService(this._service.Lightbulb)
      .addCharacteristic(this._characteristic.Saturation)
      .on('set', (value, callback) => {
        this._controller.setSaturation(value);
        this._log(`Set ${this._settings.name}'s saturation: ${value}`);
        callback();
      })
      .on('get', callback => {
        callback(null, this._controller.getSaturation());
      });
  }

  _addEventListenerHue() {
    this._accessory
      .getService(this._service.Lightbulb)
      .addCharacteristic(this._characteristic.Hue)
      .on('set', (value, callback) => {
        this._controller.setHue(value);
        this._log(`Set ${this._settings.name}'s HUE: ${value}`);
        callback();
      })
      .on('get', callback => {
        callback(null, this._controller.getHue());
      });
  }

  // todo
  _emitChangeEvents() {
    const hsv = this._controller.getSignalHsv();

    this._accessory
      .getService(this._service.Lightbulb)
      .getCharacteristic(this._characteristic.On)
      .updateValue(this._controller.isTurnedOn());

    this._accessory
      .getService(this._service.Lightbulb)
      .getCharacteristic(this._characteristic.Hue)
      .updateValue(hsv[0]);

    this._accessory
      .getService(this._service.Lightbulb)
      .getCharacteristic(this._characteristic.Saturation)
      .updateValue(hsv[1]);

    this._accessory
      .getService(this._service.Lightbulb)
      .getCharacteristic(this._characteristic.Brightness)
      .updateValue(hsv[2]);
  }

  static create(settings) {
    return new LedStripAccessory(settings);
  }
}

module.exports = LedStripAccessory;
