'use strict';

const _ = require('lodash');
const config = require('../config');
const exec = require('../lib/exec');
const fileServer = require('./file-server');
const http = require('http').createServer(fileServer);
const io = require('socket.io')(http);
const qrCode = require('qrcode-terminal');

const tv = require('../peripherals/tv').create();
const raspberry = require('../peripherals/raspberry').create();
const dateHelper = require('../lib/date-helper.js').create();
const ledStrip = require('../peripherals/led-strip').create({
  redPin: config.GPIO_RED_LED_PIN,
  greenPin: config.GPIO_GREEN_LED_PIN,
  bluePin: config.GPIO_BLUE_LED_PIN
});

const motionDetector = require('../peripherals/motion-detector').create(
  config.GPIO_MOTION_DETECTOR_PIN,
  config.NO_MOTION_GRACE_PERIOD_MS
);

const bluetoothWatcher = require('../peripherals/bluetooth-watcher').create(
  config.BL_ADDRESSES,
  config.BL_EXIT_GRACE_PERIOD_MS
);

const networkWatcher = require('../peripherals/network').create(
  config.NETWORK_IP_RANGE,
  config.NETWORK_MAC_ADDRESSES,
  config.NETWORK_EXIT_GRACE_PERIOD_MS
);

const sceneAtHome = require('../scenes/at-home').create(
  motionDetector,
  bluetoothWatcher,
  networkWatcher
);

let connectedClients = [];
let automationEnabled = true;

ledStrip.turnOff();
motionDetector.detect();
bluetoothWatcher.scan();
networkWatcher.scan();
dateHelper.start();
sceneAtHome.start();

tv.getCecList().then(cecDevices => {
  console.log(cecDevices, 'cecDevices');

  tv.setAppleTvActiveSource();
  raspberry.screenSaverTurnOff();
});

io.on('connection', function (client) {
  console.log('Socket connected:', client.id);
  connectedClients.push(client.id);
  console.log(connectedClients, 'connectedClients');

  if (automationEnabled === true) {
    if (ledStrip.isTurnedOn()) {
      ledStrip.pulse();
    }

    ledStrip.fadeInToColor(78, 8, 0);
  }

  emitState();

  client.on('automationChange', function (enabled) {
    console.debug(`AUTOMATION HAS BEEN ${automationEnabled ? 'ENABLED' : 'DISABLED'}`);
    automationEnabled = enabled;
    client.broadcast.emit('change', getState());
  });

  client.on('setLedStripHsv', function (hsv, duration) {
    ledStrip.fadeToColorHsv(hsv.h, hsv.s, hsv.v, duration)
      .then(() => {
        client.broadcast.emit('change', getState());
      });
  });

  client.on('fadeInToColor', function (rgb) {
    ledStrip.fadeInToColor(rgb.r, rgb.g, rgb.b, rgb.duration)
      .then(() => {
        client.broadcast.emit('change', getState());
      });
  });

  client.on('setLed', function (rgb) {
    ledStrip.fadeToColor(rgb.r, rgb.g, rgb.b, rgb.duration)
      .then(() => {
        client.broadcast.emit('change', getState());
      });
  });

  client.on('setScene', function (scene) {
    ledStrip.fadeBetween(scene, config.SCENE_FADE_SPEED);
    client.broadcast.emit('change', getState());
  });

  client.on('setPredefinedColor', function (rgb) {
    // todo check if it's already existing
    config.PREDEFINED_COLORS.push(rgb);
    emitState();
  });

  client.on('disconnect', function () {
    console.log('Socket client disconnect...', client.id);
    emitState();

    const clientIndex = connectedClients.indexOf(client.id);
    if (clientIndex > -1) {
      connectedClients.splice(clientIndex, 1);
    }

    // console.log(connectedClients, 'connectedClients');

    if (connectedClients.length === 0) {
      eventuallyShutDown();
    }
  });

  client.on('error', function (err) {
    console.log('Socket received error from client:', client.id);
    console.log(err);
  });
});

setInterval(() => {
  broadcastCpuTemp();
}, config.CPU_TEMP_BROADCAST_INTERVAL);

function getState() {
  return {
    automationEnabled,
    ledStrip: ledStrip.getSignal(),
    tv: tv.isTurnedOn(),
    predefinedColors: config.PREDEFINED_COLORS,
    predefinedScenes: config.PREDEFINED_SCENES,
    clientsCount: connectedClients.length,
    motionDetectedDate: motionDetector.getLastMotionDetectedDate()
  };
}

function broadcastCpuTemp() {
  raspberry.getCpuTemp().then(temp => {
    io.emit('cpuTemp', temp);
  });
}

function emitState() {
  io.emit('change', getState());
}

function eventuallyShutDown() {
  if (
    automationEnabled === true &&
    (
      (!networkWatcher.isDeviceConnected() &&
       !bluetoothWatcher.isDeviceConnected()
      ) || dateHelper.isNight()) &&
    !motionDetector.isMotionDetected() &&
    connectedClients.length === 0
  ) {
    tv.turnOff();
    ledStrip.fadeToColor(0, 0, 0);
    console.log('SHUT DOWN...');
  }
}


// Motion Sensor
motionDetector.getEvent('motionDetected').subscribe(() => {
  console.info('motion detected...');
  if (automationEnabled && dateHelper.isEvening()) {
    ledStrip.fadeInToColor(78, 8, 0, 500);
  }
  emitState();
});

motionDetector.getEvent('noMotionDetected').subscribe(() => {
  console.info('no motion detected');
  io.emit('noMotionDetected', new Date());
  eventuallyShutDown();
});


// NETWORK DETECTOR
networkWatcher.getEvent('deviceConnected').subscribe(device => {
  console.info(`NETWORK SCAN - ENTERED IP: ${device.ip} MAC: ${device.mac} ${new Date()}`);
});

networkWatcher.getEvent('allDevicesDisconnected').subscribe(device => {
  console.info('all the NETWORK devices disconnected');
  eventuallyShutDown();
});


// BLUETOOTH DETECTOR
bluetoothWatcher.getEvent('deviceConnected').subscribe(deviceInfo => {
  console.info(`device connected: ${deviceInfo.advertisement.localName} (RSSI ${deviceInfo.rssi})`);
  io.emit('deviceConnected', deviceInfo);
  if (automationEnabled) {
    ledStrip.fadeInToColor(78, 8, 0);
  }
});

bluetoothWatcher.getEvent('deviceDisconnected').subscribe(deviceInfo => {
  console.info(`device disconnected: ${deviceInfo.advertisement.localName}`);
});

bluetoothWatcher.getEvent('allDevicesDisconnected').subscribe(() => {
  console.info('all the BLUETOOTH devices disconnected');
  eventuallyShutDown();
});


// SCENE AT HOME
sceneAtHome.getEvent('deviceConnected').subscribe(deviceInfo => {
  console.log('Looks like someone is at home.');
  if (automationEnabled) {
    ledStrip.fadeInToColor(78, 8, 0);
  }
});

sceneAtHome.getEvent('allDevicesDisconnected').subscribe(() => {
  console.info('Everyone left...');
  eventuallyShutDown();
});


// DATES
_.forEach(dateHelper.getEvents(), event => {
  event.subscribe(event => {
    console.info(`EVENT ${event.event} at ${event.formattedDate}  -  ${event.minutesDiff} minutes ago`);
  });
});


// HTTP Server
http.listen(config.HTTP_SERVER_PORT, function (err) {
  if (err) {
    throw err;
  }

  exec('ifconfig wlan0 | grep "inet " | grep -v 127.0.0.1 | cut -d\\  -f10').then(ip => {
    ip = ip.split('\n')[0];

    const serverAddress = `http://${ip}:${config.HTTP_SERVER_PORT}`;
    console.log(`Server running at ${serverAddress}`);

    qrCode.generate(serverAddress, { size: 'small' }, function (qrcode) {
      console.log(qrcode);
    });
  });
});


// Start HomeKit Server
const homekitServer = require('./homekit-server').create([
  {
    name: 'Ledstrip',
    pincode: '111-11-111',
    username: 'AA:3C:ED:5A:1A:1A',
    manufacturer: 'Adam Pinter',
    model: 'v1.0',
    serialNumber: 'A12S345KGB',
    controller: ledStrip,
    type: 'led-strip'
  },
  {
    name: 'MotionSensor',
    pincode: '111-11-112',
    username: '1A:2B:3D:4D:2E:AF',
    manufacturer: 'Adam Pinter',
    model: 'v1.0',
    serialNumber: 'A12S345MTS',
    controller: motionDetector,
    type: 'motion-sensor'
  },
  {
    name: 'DeviceSensor',
    pincode: '111-11-113',
    username: '1A:2B:3D:4D:2E:1D',
    manufacturer: 'Adam Pinter',
    model: 'v1.0',
    serialNumber: 'A12S345DVS',
    controller: bluetoothWatcher,
    type: 'device-sensor'
  },
  {
    name: 'NetworkSensor',
    pincode: '111-11-114',
    username: '1B:4C:3D:4D:2E:1D',
    manufacturer: 'Adam Pinter',
    model: 'v1.0',
    serialNumber: 'A12S345DV9',
    controller: networkWatcher,
    type: 'device-sensor'
  },
  {
    name: 'HomeSensor',
    pincode: '111-11-115',
    username: '1B:4C:3D:13:2E:1D',
    manufacturer: 'Adam Pinter',
    model: 'v1.0',
    serialNumber: 'A12S345RV9',
    controller: sceneAtHome,
    type: 'device-sensor'
  },
  {
    name: 'TempSensor',
    pincode: '111-11-116',
    username: 'C1:5D:3A:AE:5E:FA',
    manufacturer: 'Adam Pinter',
    model: 'v1.0',
    serialNumber: 'A12S345TPS',
    controller: raspberry,
    type: 'temperature-sensor'
  },
  {
    name: 'YellowLed',
    pincode: '111-11-117',
    username: 'C4:5D:3A:AE:5E:FF',
    manufacturer: 'Adam Pinter',
    model: 'v1.0',
    serialNumber: 'A12S345YLL',
    controller: require('../peripherals/led').create(config.GPIO_YELLOW_LED_PIN),
    type: 'led'
  }
]).start();


// Graceful shutdown
process.on('SIGINT', () => {
  console.log('PROCESS TERMINATED...');

  bluetoothWatcher.stop();
  dateHelper.stop();

  const ledStrip = require('../peripherals/led-strip').create({
    redPin: config.GPIO_RED_LED_PIN,
    greenPin: config.GPIO_GREEN_LED_PIN,
    bluePin: config.GPIO_BLUE_LED_PIN
  });
  ledStrip.stop();

  process.exit(1);
});
