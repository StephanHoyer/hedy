'use strict';

var Immutable = require('immutable');
var iMap = Immutable.Map;
var iList = Immutable.List;
var Promise = require('bluebird');
var merge = require('lodash/object/merge');
var map = require('lodash/collection/map');

var defaultTableOptions = Immutable.Map({
  pk: 'id'
});

var zip = function(key, value) {
  var obj = {};
  obj[key] = value;
  return obj;
};

function isArray(thing) {
  return Object.prototype.toString.call(thing) === '[object Array]';
}

module.exports = function(runQuery, ormOptions) {

  ormOptions = merge({
    methods: {
      filter: function(result, fn) {
        return result.filter(fn);
      },

      map: function(result, fn) {
        return result.map(fn);
      },
    }
  }, ormOptions);

  function query(options) {

    function attachHandler(handler) {
      return function(fn) {
        return query(options.updateIn(['handler'], function(handlers) {
          return handlers.push(function(result) {
            return handler(result, fn);
          });
        }));
      };
    }

    var api = {
      get: function(id) {
        return query(options.merge({
          limit: 1,
          returnArray: false,
          where: zip(options.get('tableOptions').get('pk'), id)
        }));
      },

      where: function(where) {
        return query(options.set('where', iMap(where)));
      },

      withRelated: function(relation) {
        return query(options.updateIn(['withRelated'], function(withRelated) {
          if (isArray(relation)) {
            return withRelated.concat(relation);
          }
          return withRelated.push(relation);
        }));
      },

      count: function() {
        return query(options.set('count', true));
      },

      then: function(resolve, reject) {
        return Promise
          .resolve(options.toJS())
          .then(runQuery)
          .then(resolve, reject);
      },

      catch: function(reject) {
        return Promise
          .resolve(options.toJS())
          .then(runQuery)
          .catch(reject);
      }
    };

    map(ormOptions.methods, function(method, name) {
      api[name] = attachHandler(method);
    });

    return api;
  }

  function store(tableName, options) {
    return query(iMap({
      tableName: tableName,
      tableOptions: defaultTableOptions.merge(options),
      handler: iList(),
      withRelated: iList(),
      returnArray: true
    }));
  }

  return store;
};
