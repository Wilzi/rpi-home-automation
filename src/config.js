'use strict';

require('dotenv').config({ silence: true });

module.exports = {
  HTTP_SERVER_PORT: process.env.HTTP_SERVER_PORT || 8000,
  BL_ADDRESSES: (process.env.BL_ADDRESSES || '').split(','),
  LOG_FILE_PATH: 'log.txt',

  NETWORK_EXIT_GRACE_PERIOD_MS: 1000 * 60 * 1,
  BL_EXIT_GRACE_PERIOD_MS: 1000 * 60 * 1,
  NO_MOTION_GRACE_PERIOD_MS: 1000 * 60 * 2,

  GPIO_MOTION_DETECTOR_PIN: 24,
  GPIO_RED_LED_PIN: 22,
  GPIO_GREEN_LED_PIN: 17,
  GPIO_BLUE_LED_PIN: 27,
  GPIO_YELLOW_LED_PIN: 19,

  NETWORK_IP_RANGE: '10.0.0.1-100',
  NETWORK_MAC_ADDRESSES: (process.env.NETWORK_MAC_ADDRESSES || '').split(','),
  
  LOCATION_LAT: 48.2082,
  LOCATION_LNG: 16.3738,
  SCENE_FADE_SPEED: 20000,
  CPU_TEMP_BROADCAST_INTERVAL: 5000,
  PREDEFINED_COLORS: [ // todo should be HSV instead of RGB
    [0, 0, 0],
    [12, 2, 0],
    [78, 8, 0],
    [255, 32, 0],
    [255, 255, 255],
    [255, 32, 87],
    [34, 114, 60],
    [34, 0, 120],
    [255, 168, 0]
  ],
  PREDEFINED_SCENES: [
    [[50, 10, 0], [80, 10, 0], [255, 32, 0], [67, 20, 0]],
    [[255, 32, 87], [34, 0, 120], [255, 50, 0]],
    [[255, 168, 0], [20, 239, 32], [0, 113, 187], [34, 0, 120], [199, 0, 161]],
    [[20, 215, 144], [255, 28, 104], [25, 143, 227]]
  ]
};
