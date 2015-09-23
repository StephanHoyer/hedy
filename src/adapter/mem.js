'use strict';
var every = require('lodash/collection/every');
var clone = require('lodash/lang/clone');
var isArray = require('lodash/lang/isArray');
var Promise = require('bluebird');

module.exports = function(data) {

  function get(options) {
    var list = data[options.tableName].filter(entity => {
      return every(options.where, (value, key) => {
        if (isArray(value)) {
          return value.indexOf(entity[key]) >= 0;
        }
        return entity[key] === value;
      });
    }).map(clone);
    if (!options.returnArray) {
      list = [list[0]];
    }

    var listPromise = Promise.all(options.withRelated.map(relation => relation(list, options)));


    if (!options.returnArray) {
      return listPromise.then(() => list[0]);
    }

    return listPromise
      .then(() => Promise.reduce(options.converter, function(list, handler) {
        return handler(list);
      }, list));
  }

  return {
    get: get
  };

};
