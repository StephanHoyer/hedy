'use strict'

const isArray = require('lodash/isArray')

module.exports = {
  whereFromPk: (options, item) => {
    const where = {}
    if (isArray(options.pk)) {
      options.pk.map(key => (where[key] = item[key]))
    } else {
      where[options.pk] = item[options.pk]
    }
    return where
  },
}
