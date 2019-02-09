'use strict'

const map = require('lodash/map')
const filter = require('lodash/filter')
const groupBy = require('lodash/groupBy')
const keyBy = require('lodash/keyBy')
const zipObject = require('lodash/zipObject')
const isArray = require('lodash/isArray')
const O = require('patchinko/immutable')
const relations = require('./relations')

module.exports = function(adapter, options = {}) {
  if (options && options.pk && !isArray(options.pk)) {
    options.pk = [options.pk]
  }
  options = O(
    {
      methods: {
        map,
        filter,
        groupBy,
        keyBy,
      },
    },
    { methods: O(options.methods) }, // patch methods
    O(options, {
      // patch rest
      methods: O,
    })
  )

  function evolve(query, patch) {
    query = O(query, patch)

    function whereFromId(id) {
      return zipObject(query.pk, isArray(id) ? id : [id])
    }

    function attachConverter(converter) {
      return fn =>
        evolve(query, {
          converter: O(converters =>
            converters.concat(result => converter(result, fn))
          ),
        })
    }

    const api = {
      table(name) {
        if (name) {
          return evolve(query, { tableName: name })
        }
        return query.tableName
      },

      pk(pk) {
        if (pk) {
          return evolve(query, {
            pk: isArray(pk) ? pk : [pk],
          })
        }
        return query.pk
      },

      get(id) {
        return evolve(query, {
          limit: 1,
          returnArray: false,
          where: whereFromId(id),
        }).load()
      },

      where(where) {
        return evolve(query, { where })
      },

      withRelated(relation) {
        return evolve(query, {
          withRelated: O(withRelated => withRelated.concat(relation)),
        })
      },

      count() {
        return evolve(query, { count: true }).load()
      },

      first() {
        return evolve(query, { limit: 1, returnArray: false }).load()
      },

      put(id, data) {
        if (!data) {
          throw new Error('no data provided for put')
        }
        return evolve(query, {
          type: 'put',
          where: whereFromId(id),
          data,
        }).load()
      },

      patch(id, data) {
        return evolve(query, {
          type: 'patch',
          where: whereFromId(id),
          data,
        }).load()
      },

      post(data) {
        return evolve(query, {
          type: 'post',
          data,
        }).load()
      },

      del(id) {
        return evolve(query, {
          type: 'del',
          where: whereFromId(id),
        }).load()
      },

      load() {
        return adapter[query.type](query)
      },
    }

    map(options.methods, function(method, name) {
      api[name] = attachConverter(method)
    })

    return api
  }

  function store(tableName) {
    return evolve({
      type: 'get',
      tableName,
      pk: ['id'],
      where: [],
      converter: [],
      withRelated: [],
      returnArray: true,
    })
  }
  return store
}

Object.assign(module.exports, relations)
