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

module.exports = function(runQuery, options) {

  options = merge({
    methods: {
      filter: function(result, fn) {
        return result.filter(fn);
      },

      map: function(result, fn) {
        return result.map(fn);
      },
    }
  }, options);

  function evolve(query) {

    function attachconverter(converter) {
      return function(fn) {
        return evolve(query.updateIn(['converter'], function(converters) {
          return converters.push(function(result) {
            return converter(result, fn);
          });
        }));
      };
    }

    var api = {
      get: function(id) {
        return evolve(query.merge({
          limit: 1,
          returnArray: false,
          where: zip(query.getIn(['tableOptions', 'pk']), id)
        }));
      },

      where: function(where) {
        return evolve(query.set('where', iMap(where)));
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

      save: function(id, data) {
        if (data) {
          return evolve(query.merge({
            type: 'update',
            updateId: id,
            saveData: data
          }));
        }
        return evolve(query.merge({
          type: 'create',
          saveData: id
        }));
      },

      then: function(resolve, reject) {
        return Promise
          .resolve(query.toJS())
          .then(runQuery)
          .then(resolve, reject);
      },

      catch: function(reject) {
        return Promise
          .resolve(query.toJS())
          .then(runQuery)
          .catch(reject);
      }
    };

    map(options.methods, function(method, name) {
      api[name] = attachconverter(method);
    });

    return api;
  }

  function store(tableName, query) {
    return evolve(iMap({
      tableName: tableName,
      tableOptions: defaultTableOptions.merge(query),
      converter: iList(),
      withRelated: iList(),
      returnArray: true
    }));
  }

  return store;
};
