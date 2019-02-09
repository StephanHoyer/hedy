'use strict'

const pluralize = require('pluralize')

const get = key => entity => entity[key]

function wrapApi(fn, options) {
  fn.as = function(name) {
    options.relationKey = name
    return fn
  }
  return fn
}

function belongsTo(query, options) {
  options = Object.assign(
    {
      query,
      relationKey: query.table(),
      fk: query.table() + 'Id',
      pk: query.pk(),
    },
    options
  )
  return wrapApi(async function(list) {
    const relatedItems = await query
      .where({ [options.pk]: list.map(get(options.fk)) })
      .load()
    return list.map(item => {
      const relatedItem = relatedItems.find(
        relatedItem => relatedItem[options.pk[0]] === item[options.fk]
      )
      if (options.relationKey === false) {
        // colapse mode: Properties of related items are mixed into item
        // This is e. G. used by the hasManyThrough relation
        Object.assign(item, relatedItem)
      } else {
        item[options.relationKey] = relatedItem
      }
      return item
    })
  }, options)
}

function hasMany(query, options) {
  options = Object.assign(
    {
      query,
      relationKey: pluralize(query.table()),
      pk: query.pk(),
    },
    options
  )
  return wrapApi(async function(list, parentQuery) {
    options.fk = options.fk || parentQuery.tableName + 'Id'
    const relatedItemsByFK = await query
      .where({ [options.fk]: list.map(get(parentQuery.pk)) })
      .groupBy(options.fk)
      .load()
    return list.map(item => {
      item[options.relationKey] = relatedItemsByFK[item.id] || []
      return item
    })
  }, options)
}

function hasManyThrough(query, throughQuery, options) {
  options = Object.assign(
    {
      fromPk: ['id'],
      toPk: ['id'],
    },
    options
  )
  const rightQuery = belongsTo(query, {
    fk: options.toFk,
    pk: options.toPk,
    relationKey: false,
  })
  const relation = hasMany(throughQuery.withRelated(rightQuery), {
    fk: options.fromFk,
  })
  relation.link = function(itemA, itemB) {
    const link = {}
    link[options.fromFk] = itemA[options.fromPk]
    link[options.toFk] = itemB[options.toPk]

    return throughQuery.post(link)
  }
  relation.unlink = function(itemA, itemB) {
    return throughQuery.del([itemA[options.fromPk], itemB[options.toPk]])
  }
  return relation
}

function hasOne(query, options) {
  options = Object.assign(
    {
      relationKey: query.table(),
      query,
      pk: query.pk(),
    },
    options
  )
  return wrapApi(async function(list, parentQuery) {
    options.fk = options.fk || parentQuery.tableName + 'Id'
    const relatedItemsByFK = await query
      .where({[options.fk]: list.map(get(options.pk))})
      .keyBy(options.fk)
      .load()
    return list.map(item => {
      item[options.relationKey] = relatedItemsByFK[item.id]
      return item
    })
  }, options)
}

module.exports = {
  belongsTo,
  hasMany,
  hasManyThrough,
  hasOne,
}
