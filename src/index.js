var Immutable = require('immutable');
var iMap = Immutable.Map;
var iList = Immutable.List;

var defaultTableOptions = Immutable.Map({
  pk: 'id'
});

var zip = function(key, value) {
  var obj = {};
  obj[key] = value;
  return obj;
};

module.exports = function(config) {

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

    return {
      _attachHandler: attachHandler,
      _options: options,

      get: function(id) {
        return query(options.merge({
          limit: 1,
          returnArray: false,
          where: zip(options.get('tableOptions').get('pk'), id)
        }));
      },

      where: function(where) {
        return query(options.merge({
          where: where
        }));
      },

      filter: attachHandler(function(result, fn) {
        return result.filter(fn);
      }),

      map: attachHandler(function(result, fn) {
        return result.map(fn);
      })
    };
  }

  function store(tableName, options) {
    return query(iMap({
      tableName: tableName,
      tableOptions: defaultTableOptions.merge(options),
      handler: iList(),
      returnArray: true
    }));
  }

  return store;
};
