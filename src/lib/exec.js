'use strict';

const q = require('q');
const exec = require('child_process').exec;

module.exports = command => {
  const deferred = q.defer();

  exec(command, (err, stdout, stderr) => {
    if (err) {
      deferred.reject(new Error(stderr));
      return;
    }

    deferred.resolve(stdout);
  });

  return deferred.promise;
};
