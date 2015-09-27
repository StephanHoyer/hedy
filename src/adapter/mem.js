'use strict';

var every = require('lodash/collection/every');
var clone = require('lodash/lang/clone');
var isArray = require('lodash/lang/isArray');
var remove = require('lodash/array/remove');
var Promise = require('bluebird');

module.exports = function(data) {

  function where(tableName, whereCondition) {
    return data[tableName].filter(entity => {
      return every(whereCondition, (value, key) => {
        if (isArray(value)) {
          return value.indexOf(entity[key]) >= 0;
        }
        return entity[key] === value;
      });
    });
  }

  function get(options) {
    var list = where(options.tableName, options.where);
    if (!options.returnArray) {
      if (!list.length) {
        throw new Error('No item found');
      }
      list = [list[0]];
    }
    list = list.map(clone);

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
    options.where = {};
    options.pk.map(key => options.where[key] = options.data[key]);
    var item = where(options.tableName, options.where)[0];
    if (item) {
      throw Error('Item with key ' + options.data + ' already exists');
    }
    data[options.tableName].push(options.data);
    return options.data;
  }

  function put(options) {
    var list = data[options.tableName];
    var item = where(options.tableName, options.where)[0];
    if (item) {
      remove(list, item);
    }
    list.push(options.data);
    return options.data;
  }

  function patch(options) {
    var item = where(options.tableName, options.where)[0];
    Object.assign(item, options.data);
    return item;
  }

  function del(options) {
    var item = where(options.tableName, options.where)[0];
    if (!item) {
      throw Error('Item with key ' + options.where + ' does not exist');
    }
    remove(data[options.tableName], item);
  }

  return {
    get: get,
    put: put,
    patch: patch,
    post: post,
    del: del
  };

};
