'use strict';
var every = require('lodash/collection/every');
var clone = require('lodash/lang/clone');
var isArray = require('lodash/lang/isArray');
var remove = require('lodash/array/remove');
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
      if (!list.length) {
        throw new Error('No item found');
      }
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

  function post(options) {
    var list = data[options.tableName];
    var item = list.find(function(item) {
      return item.id === options.id;
    });
    remove(list, item);
    list.push(options.data);
    return options.data;
  }

  function put(options) {
    var list = data[options.tableName];
    var item = list.find(function(item) {
      return item.id === options.id;
    });
    remove(list, item);
    list.push(options.data);
    return options.data;
  }

  function patch(options) {
    var list = data[options.tableName];
    var item = list.find(function(item) {
      return item.id === options.id;
    });
    Object.assign(item, options.data);
    return item;
  }

  return {
    get: get,
    put: put,
    patch: patch,
    post: post
  };

};
