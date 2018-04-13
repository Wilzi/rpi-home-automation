'use strict';

class Events {

  constructor() {
    this._events = {};
    this._initEvents();
  }

  getEvents() {
    return this._events;
  }

  getEvent(name) {
    return this._events[name];
  }

  _initEvents() {
    throw new Error('_initEvents method missing from child class');
  }
}

module.exports = Events;
