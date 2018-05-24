'use strict';

const exec = require('../lib/exec');

// todo
// - [ ] Use async functions!

// Docs:
// https://raspberrypi.stackexchange.com/questions/8698/how-can-my-raspberry-pi-turn-on-off-my-samsung-tv
// https://github.com/senzil/cec-monitor

class Tv {
  constructor() {
    // todo parse from cec client list on startup!
    this._appleTvId = 10;
    this._raspberryId = 20;
    this._isTurnedOn = false;
  }

  isTurnedOn() {
    return this._isTurnedOn;
  }

  getStatus() {
    return exec('echo "pow 0" | cec-client -s |grep "power status:"').then(stdout => {
      console.log('TV STATUS:', stdout);
    });
  }

  toggle() {
    if(this.isTurnedOn()) {
      return this.turnOff();
    }

    return this.turnOn();
  }

  turnOn() {
    return exec('echo "on 0" | cec-client -s').then(() => {
      console.debug('TURN TV ON');
      this._isTurnedOn = true;
    });
  }

  turnOff() {
    return exec('echo "standby 0" | cec-client -s').then(() => {
      console.debug('TURN TV OFF');
      this._isTurnedOn = false;
    });
  }

  getCecList() {
    return exec('echo "scan" | cec-client RPI -s -d 1').then(stdout => {
      return this._parseCecList(stdout);
    });
  }

  setRaspberryActiveSource() {
    return this._setSourceById(this._raspberryId);
  }

  setAppleTvActiveSource() {
    return this._setSourceById(this._appleTvId);
  }

  _setSourceById(id) {
    return exec(`echo "tx 2F:82:${id}:00" | cec-client RPI -s -d 4`).then(() => {
      console.log('SET TV SOURCE TO :', id);
    });
  }

  _parseCecList(input) {
    const devices = input.split('\n\n');
    const regexp = /([\w #\d]+):\s+([\w\d.]+)/ig;

    const devicesData = [];

    for(let device of devices) {
      const matches = device.match(regexp);
      if (matches) {
        const d = [];
        for(let match of matches) {
          const m = match.match(/([\w #\d]+):\s+([\w\d.]+)/i);
          d[m[1]] = m[2];
        }

        devicesData.push(d);
      }
    }

    return devicesData;
  }

  static create() {
    return new Tv;
  }
}

module.exports = Tv;
