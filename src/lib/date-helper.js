'use strict';

const Rx = require('rx');
const _ = require('lodash');
const moment = require('moment');
const SunCalc = require('suncalc');
const config = require('../config');
const Events = require('./events');

const CHECK_INTERVAL_MS = 1000 * 60;
const EVENT_EMIT_THRESHOLD_MIN = 5;

class DateHelper extends Events{

  constructor() {
    super();

    this._minuteInterval = null;
    this._alreadyEmitedEvents = [];
  }

  // Event descriptions: https://github.com/mourner/suncalc#sunlight-times
  _initEvents() {
    this._events = {
      solarNoon: new Rx.Subject(),
      nadir: new Rx.Subject(),
      sunrise: new Rx.Subject(),
      sunset: new Rx.Subject(),
      sunriseEnd: new Rx.Subject(),
      sunsetStart: new Rx.Subject(),
      dawn: new Rx.Subject(),
      dusk: new Rx.Subject(),
      nauticalDawn: new Rx.Subject(),
      nauticalDusk: new Rx.Subject(),
      nightEnd: new Rx.Subject(),
      night: new Rx.Subject(),
      goldenHourEnd: new Rx.Subject(),
      goldenHour: new Rx.Subject()
    };
  }

  start() {
    this._emitDailyEvents();

    this._minuteInterval = setInterval(
      this._emitDailyEvents.bind(this),
      CHECK_INTERVAL_MS
    );
  }

  stop() {
    clearInterval(this._minuteInterval);
  }

  // todo clear already emited events when it's a new day!
  _emitDailyEvents() {
    const currentDate = moment();
    const solarEvents = SunCalc.getTimes(new Date(), config.LOCATION_LAT, config.LOCATION_LNG);

    for (let event in solarEvents) {
      const date = solarEvents[event];

      if (date <= currentDate) {
        const minutesDiff = moment(currentDate).diff(moment(date), 'minutes');

        // console.log('PAST', event, moment(date).fromNow(), ', minutes ago: ', minutesDiff);

        if (minutesDiff <= EVENT_EMIT_THRESHOLD_MIN && !this._isEventAlreadyEmited(event)) {
//          console.log('EVENT EMIT', event, moment(date).fromNow(), ', minutes ago: ', minutesDiff);

          const formattedDate = moment(date).format('YYYY-MM-DD HH:mm:ss');
          this._events[event].onNext({ formattedDate, event, minutesDiff });
          this._alreadyEmitedEvents.push(event);
        }
      }
    }
  }

  _isEventAlreadyEmited(eventName) {
    return _.indexOf(this._alreadyEmitedEvents, eventName) > -1;
  }

  isMorning() {
    const hr = moment().format('H');
    if (hr >= 0 && hr < 12) {
      return true;
    }

    return false;
  }

  isAfternoon() {
    const hr = moment().format('H');
    if (hr >= 12 && hr <= 17) {
      return true;
    }

    return false;
  }

  isEvening() {
    const hr = moment().format('H');
    if (hr > 17) {
      return true;
    }

    return false;
  }

  static create() {
    return new DateHelper();
  }
}

module.exports = DateHelper;
