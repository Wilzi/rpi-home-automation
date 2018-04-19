'use strict';

const _ = require('lodash');
const config = require('./config');
const Led = require('./peripherals/led');

const red = Led.create(config.GPIO_RED_LED_PIN);
const green = Led.create(config.GPIO_GREEN_LED_PIN);
const blue = Led.create(config.GPIO_BLUE_LED_PIN);
const yellow = Led.create(config.GPIO_YELLOW_LED_PIN);


function fadeInFadeOut() {
  return Promise.all([
    red.fadeIn(),
    blue.fadeIn(),
    yellow.fadeIn(),
    green.fadeIn()
  ])
  .then(() => Promise.all([red.fadeOut(),blue.fadeOut(),yellow.fadeOut(),green.fadeOut()]))
  .then(() => fadeInFadeOut());	
};

fadeInFadeOut();

