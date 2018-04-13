'use strict';

const fs = require('fs');
const moment = require('moment');

class Log {

  constructor(logFilePath) {
    this._writeStream = fs.createWriteStream(logFilePath);
  }

  info(text) {
    const date = moment().format('YYYY-MM-DD HH:mm:ss');
    const logLine = `${date} [info] - ${text}`;

    console.log(logLine);
    this._writeToFile(logLine);
  }

  stop() {
    this._writeStream.end();
  }

  _writeToFile(logLine) {
    this._writeStream.write(logLine + '\n');
  }

  static create(logFilePath) {
    return new Log(logFilePath);
  }
}

module.exports = Log;
