'use strict';
var every = require('lodash/collection/every');
var isArray = require('lodash/lang/isArray');
var Promise = require('bluebird');

module.exports = function(data) {
  return function runQuery(options) {
    var list = data[options.tableName].filter(entity => {
      return every(options.where, (value, key) => {
        if (isArray(value)) {
          return value.indexOf(entity[key]) >= 0;
        }
        return entity[key] === value;
      });
    });
    return Promise.all(options.withRelated.map(relation => relation(list, options)))
      .then(() => Promise.reduce(options.converter, (list, handler) => handler(list), list));
  };
};
