'use strict';

var Immutable = require('immutable');
var iMap = Immutable.Map;
var iList = Immutable.List;
var Promise = require('bluebird');
var merge = require('lodash/object/merge');
var map = require('lodash/collection/map');
var map = require('lodash/collection/map');
var filter = require('lodash/collection/filter');
var groupBy = require('lodash/collection/groupBy');
var indexBy = require('lodash/collection/indexBy');

var relations = require('./relations');
var zip = require('./util').zip;

function isArray(thing) {
  return Object.prototype.toString.call(thing) === '[object Array]';
}

module.exports = function(adapter, options) {

  options = merge({
    methods: {
      map: map,
      filter: filter,
      groupBy: groupBy,
      indexBy: indexBy
    }
  }, options);

  function evolve(query) {

    function attachConverter(converter) {
      return function(fn) {
        return evolve(query.updateIn(['converter'], function(converters) {
          return converters.push(function(result) {
            return converter(result, fn);
          });
        }));
      };
    }

    var api = {
      table: function(name) {
        if (name) {
          return evolve(query.set('tableName'), name);
        }
        return query.get('tableName');
      },

      pk: function(pk) {
        if (pk) {
          return evolve(query.set('pk', pk));
        }
        return query.get('pk');
      },

      get: function(id) {
        return evolve(query.merge({
          limit: 1,
          returnArray: false,
          where: zip(query.get('pk'), id)
        }));
      },

      where: function(where) {
        return evolve(query.set('where', where));
      },

      withRelated: function(relation) {
        return evolve(query.updateIn(['withRelated'], function(withRelated) {
          if (isArray(relation)) {
            return withRelated.concat(relation);
          }
          return withRelated.push(relation);
        }));
      },

      count: function() {
        return evolve(query.set('count', true));
      },

      put: function(id, data) {
        return evolve(query.merge({
          type: 'put',
          id: id,
          data: data
        }));
      },

      patch: function(id, data) {
        return evolve(query.merge({
          type: 'patch',
          id: id,
          data: data
        }));
      },

      post: function(data) {
        return evolve(query.merge({
          type: 'post',
          data: data
        }));
      },

      del: function(id) {
        return evolve(query.merge({
          type: 'del',
          id: id
        }));
      },

      then: function(resolve, reject) {
        return Promise
          .resolve(query.toJS())
          .then(adapter[query.get('type')])
          .then(resolve, reject);
      },

      catch: function(reject) {
        return Promise
          .resolve(query.toJS())
          .then(adapter.get)
          .catch(reject);
      }
    };

    map(options.methods, function(method, name) {
      api[name] = attachConverter(method);
    });

    return api;
  }

  function store(tableName) {
    return evolve(iMap({
      type: 'get',
      tableName: tableName,
      pk: 'id',
      where: iMap(),
      converter: iList(),
      withRelated: iList(),
      returnArray: true
    }));
  }

  return store;
};

Object.assign(module.exports, relations);
