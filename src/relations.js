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
  options = merge({
    query: query,
    relationKey: query.table(),
    fk: query.table() + 'Id',
    pk: query.pk()
  }, options);
  return wrapApi(function(list) {
    return query
      .where(zip(options.pk, list.map(get(options.fk))))
      .then(relatedItems => {
        list.map(item => {
          var relatedItem = relatedItems.find(relatedItem => relatedItem[options.pk[0]] === item[options.fk]);
          if (options.relationKey === false) {
            // colapse mode: Properties of related items are mixed into item
            // This is e. G. used by the hasManyThrough relation
            Object.assign(item, relatedItem);
          } else {
            item[options.relationKey] = relatedItem;
          }
          return item;
        });
      });
  }, options);
}

function hasMany(query, options) {
  options = merge({
    query: query,
    relationKey: pluralize(query.table()),
    pk: query.pk()
  }, options);
  return wrapApi(function(list, parentQuery) {
    options.fk = options.fk || parentQuery.tableName + 'Id';
    return query
      .where(zip(options.fk, list.map(get(parentQuery.pk))))
      .groupBy(options.fk)
      .then(relatedItemsByFK => {
        list.map(item => {
          item[options.relationKey] = relatedItemsByFK[item.id] || [];
          return item;
        });
      });
  }, options);
}

function hasManyThrough(query, throughQuery, options) {
  options = merge({
    fromPk: ['id'],
    toPk: ['id']
  }, options);
  var rightQuery = belongsTo(query, {
    fk: options.toFk,
    pk: options.toPk,
    relationKey: false
  });
  var relation = hasMany(throughQuery.withRelated(rightQuery), {
    fk: options.fromFk,
  });
  relation.link = function(itemA, itemB) {
    var link = {};
    link[options.fromFk] = itemA[options.fromPk];
    link[options.toFk] = itemB[options.toPk];

    return throughQuery.post(link);
  };
  relation.unlink = function(itemA, itemB) {
    return throughQuery.del([itemA[options.fromPk], itemB[options.toPk]]);
  };
  return relation;
}

function hasOne(query, options) {
  options = merge({
    relationKey: query.table(),
    query: query,
    pk: query.pk()
  }, options);
  return wrapApi(function(list, parentQuery) {
    options.fk = options.fk || parentQuery.tableName + 'Id';
    return query
      .where(zip(options.fk, list.map(get(options.pk))))
      .indexBy(options.fk)
      .then(relatedItemsByFK => {
        list.map(item => {
          item[options.relationKey] = relatedItemsByFK[item.id];
          return item;
        });
      });
  }, options);
}

module.exports = {
  belongsTo: belongsTo,
  hasMany: hasMany,
  hasManyThrough: hasManyThrough,
  hasOne: hasOne
};
