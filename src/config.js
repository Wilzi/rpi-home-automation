'use strict';

require('dotenv').config({ silence: true });

module.exports = {
  BL_ADDRESSES: (process.env.BL_ADDRESSES || '').split(','),
  LOG_FILE_PATH: 'log.txt',
  BL_EXIT_GRACE_PERIOD_MS: 1000 * 60,
  NO_MOTION_GRACE_PERIOD_MS: 1000 * 60,
  GPIO_MOTION_DETECTOR_PIN: 24,
  GPIO_GREEN_LED_PIN: 17,
  GPIO_RED_LED_PIN: 27,
  GPIO_BLUE_LED_PIN: 6
};
