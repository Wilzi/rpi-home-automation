'use strict';

const exec = require('child_process').exec;

// todo
// - [ ] Use async functions!

class ScreenSaver {
  turnOn() {
    return exec('xset dpms force off', () => {
      console.log('TURN SCREEN SAVER ON');
    });
  }

  turnOff() {
    return exec('xset dpms force on', () => {
      console.log('TURN SCREEN SAVER OFF');
    });
  }

  static create() {
    return new ScreenSaver();
  }
}

module.exports = ScreenSaver;
