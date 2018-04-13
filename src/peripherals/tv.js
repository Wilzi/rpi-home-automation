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
    this._raspberryId = 10;
    this._appleTvId = 30;
  }

  getStatus() {
    return exec('echo "pow 0" | cec-client -s |grep "power status:"').then(stdout => {
      console.log('TV STATUS:', stdout);
    });
  }

  turnOn() {
    return exec('echo "on 0" | cec-client -s').then(() => {
      console.log('TURN TV ON');
    });
  }

  turnOff() {
    return exec('echo "standby 0" | cec-client -s').then(() => {
      console.log('TURN TV OFF');
    });
  }

  getCecList() {
    return exec('echo "scan" | cec-client RPI -s -d 1').then(stdout => {
      console.log(stdout, 'LIST CEC');
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

  static create() {
    return new Tv;
  }
}

module.exports = Tv;
