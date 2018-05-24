'use strict';

const exec = require('../lib/exec');

class Raspberry {

  getCpuTemp() {
    return exec('cat /sys/class/thermal/thermal_zone0/temp').then(t => {
      return (parseFloat(t) / 1000).toFixed(1);
    });
  }

  // https://raspberrypi.stackexchange.com/questions/63350/getting-to-display-images-with-feh-at-startup
  // todo return with image stream
  takeScreenshot() {
    return exec('export DISPLAY=:0; scrot /tmp/screenshot.png -q 10 -t 5');
  }

  screenSaverTurnOn() {
    return exec('export DISPLAY=:0; xset dpms force off',).then(stdout => {
      console.log('TURN SCREEN SAVER ON');

      return stdout;
    });
  }

  screenSaverTurnOff() {
    return exec('export DISPLAY=:0; xset dpms force on').then(stdout => {
      console.log('TURN SCREEN SAVER OFF');

      return stdout;
    });
  }

  static create() {
    return new Raspberry();
  }
}

module.exports = Raspberry;
