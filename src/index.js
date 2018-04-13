'use strict';

const Log = require('./lib/log');

const config = require('./config');
const log = Log.create(config.LOG_FILE_PATH);
const Tv = require('./peripherals/tv');
const Led = require('./peripherals/led');
const ScreenSaver = require('./peripherals/screen-saver');
const BluetoothWatcher = require('./peripherals/bluetooth-watcher');
const MotionDetector = require('./peripherals/motion-detector');

const ledRed = Led.create(config.GPIO_RED_LED_PIN);
const ledGreen = Led.create(config.GPIO_GREEN_LED_PIN);
const ledBlue = Led.create(config.GPIO_BLUE_LED_PIN);

const tv = Tv.create();
const screenSaver = ScreenSaver.create();
const bluetoothWatcher = BluetoothWatcher.create(config.BL_ADDRESSES, config.BL_EXIT_GRACE_PERIOD_MS);
const motionDetector = MotionDetector.create(config.GPIO_MOTION_DETECTOR_PIN, config.NO_MOTION_GRACE_PERIOD_MS);

const eventCallbacks = {
  deviceConnected: deviceInfo => {
    log.info(`device connected: ${deviceInfo.advertisement.localName} (RSSI ${deviceInfo.rssi})`);
    screenSaver.turnOff();
    ledBlue.fadeIn();
    tv.turnOn();
    tv.setRaspberryActiveSource();
  },
  deviceDisconnected: deviceInfo => {
    log.info('device disconnected: ', deviceInfo.advertisement.localName);
  },
  allDevicesDisconnected: () => {
    log.info('all the devices disconnected');

    if (motionDetector.isMotionDetected() === false) {
      tv.turnOff();
      ledBlue.fadeOut();
    }
  },
  motionDetected: () => {
    log.info('motion detected...');
    screenSaver.turnOff();
    ledGreen.fadeOut();
    ledRed.fadeIn();
  },
  noMotionDetected: () => {
    log.info('no motion detected');
    screenSaver.turnOn();
    ledGreen.fadeIn();
    ledRed.fadeOut();

    if (bluetoothWatcher.isDeviceConnected() === false) {
      tv.turnOff();
      ledBlue.fadeOut();
    }
  }
};

// Startup
tv.getCecList();
ledGreen.fadeIn();
bluetoothWatcher.setEventCallbacks(eventCallbacks).scan();
motionDetector.setEventCallbacks(eventCallbacks).detect();

process.on('SIGINT', () => {
  log.info('PROCESS TERMINATED...');
  bluetoothWatcher.stop();
  ledGreen.stop();
  ledBlue.stop();
  ledRed.stop();
  log.stop();
  process.exit(1);
});
