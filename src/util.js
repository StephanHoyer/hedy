'use strict';

var isArray = require('lodash/lang/isArray');

module.exports = {
  zip: (key, value) => {
    var obj = {};
    obj[key] = value;
    return obj;
  },

  whereFromPk: (options, item) => {
    var where = {};
    if (isArray(options.pk)) {
      options.pk.map(key => where[key] = item[key]);
    } else {
      where[options.pk] = item[options.pk];
    }
    return where;
  }
};
