'use strict';
var every = require('lodash/collection/every');
var isArray = require('lodash/lang/isArray');
var merge = require('lodash/object/merge');
var Promise = require('bluebird');
var zip = require('../util').zip;

const get = key => (entity => entity[key]);

module.exports = function(data) {
  function runQuery(options) {
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
  }

  function belongsTo(query, options) {
    options = merge({
      relationKey: query.table(),
      fk: query.table() + 'Id',
      pk: query.pk()
    }, options);
    return function(list) {
      return query
        .where(zip(options.pk, list.map(get(options.fk))))
        .indexBy(options.pk)
        .then(relatedItemsByPK => {
          list.map(item => {
            item[options.relationKey] = relatedItemsByPK[item[options.fk]];
            return item;
          });
        });
    };
  }

  function hasMany(query, options) {
    return function(list, parentQuery) {
      options = merge({
        relationKey: query.table(),
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
    };
  }

  return {
    runQuery,
    belongsTo,
    hasMany
  };
};
