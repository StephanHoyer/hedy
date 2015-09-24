'use strict';

var merge = require('lodash/object/merge');
var zip = require('./util').zip;
var pluralize = require('pluralize');

const get = key => (entity => entity[key]);

function wrapApi(fn, options) {
  fn.as = function(name) {
    options.relationKey = name;
    return fn;
  };
  return fn;
}

function belongsTo(query, options) {
  options = options || {};
  return wrapApi(function(list) {
    options = merge({
      relationKey: query.table(),
      fk: query.table() + 'Id',
      pk: query.pk()
    }, options);
    return query
      .where(zip(options.pk, list.map(get(options.fk))))
      .indexBy(options.pk)
      .then(relatedItemsByPK => {
        list.map(item => {
          item[options.relationKey] = relatedItemsByPK[item[options.fk]];
          return item;
        });
      });
  }, options);
}

function hasMany(query, options) {
  options = options || {};
  return wrapApi(function(list, parentQuery) {
    options = merge({
      relationKey: pluralize(query.table()),
      fk: parentQuery.tableName + 'Id',
      pk: query.pk()
    }, options);
    return query
      .where(zip(options.fk, list.map(get(options.pk))))
      .groupBy(options.fk)
      .then(relatedItemsByFK => {
        list.map(item => {
          item[options.relationKey] = relatedItemsByFK[item.id];
          return item;
        });
      });
  });
}

function hasOne(query, options) {
  options = options || {};
  return wrapApi(function(list, parentQuery) {
    options = merge({
      relationKey: query.table(),
      fk: parentQuery.tableName + 'Id',
      pk: query.pk()
    }, options);
    return query
      .where(zip(options.fk, list.map(get(options.pk))))
      .indexBy(options.fk)
      .then(relatedItemsByFK => {
        list.map(item => {
          item[options.relationKey] = relatedItemsByFK[item.id];
          return item;
        });
      });
  });
}

module.exports = {
  belongsTo,
  hasMany,
  hasOne
};
