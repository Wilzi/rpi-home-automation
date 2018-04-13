'use strict';

const config = require('./config');
const Log = require('./lib/log');
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


// Startup
tv.getCecList();
ledGreen.fadeIn();
bluetoothWatcher.scan();
motionDetector.detect();


// Subscribe Events
motionDetector.getEvent('motionDetected').subscribe(() => {
  log.info('motion detected...');
  screenSaver.turnOff();
  ledGreen.fadeOut();
  ledRed.fadeIn();
});

motionDetector.getEvent('noMotionDetected').subscribe(() => {
  log.info('no motion detected');
  screenSaver.turnOn();
  ledGreen.fadeIn();
  ledRed.fadeOut();

  if (bluetoothWatcher.isDeviceConnected() === false) {
    tv.turnOff();
    ledBlue.fadeOut();
  }
});

bluetoothWatcher.getEvent('deviceConnected').subscribe(deviceInfo => {
  log.info(`device connected: ${deviceInfo.advertisement.localName} (RSSI ${deviceInfo.rssi})`);

  tv.turnOn();
  ledBlue.fadeIn();
  screenSaver.turnOff();
  tv.setRaspberryActiveSource();
});

bluetoothWatcher.getEvent('deviceDisconnected').subscribe(deviceInfo => {
  log.info('device disconnected: ', deviceInfo.advertisement.localName);
});

bluetoothWatcher.getEvent('allDevicesDisconnected').subscribe(() => {
  log.info('all the devices disconnected');

  if (motionDetector.isMotionDetected() === false) {
    tv.turnOff();
    ledBlue.fadeOut();
  }
});


// Graceful shutdown
process.on('SIGINT', () => {
  log.info('PROCESS TERMINATED...');
  bluetoothWatcher.stop();
  ledGreen.stop();
  ledBlue.stop();
  ledRed.stop();
  log.stop();
  process.exit(1);
});
