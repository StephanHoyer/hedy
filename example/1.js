'use strict'

const hedy = require('../index')
const memAdapter = require('../adapter/mem')

const log = function(thing) {
  console.log(JSON.stringify(thing, true, 2))
}

const data = {
  user: [
    { id: 1, name: 'heiner' },
    { id: 2, name: 'klaus' },
    { id: 3, name: 'manfred' },
  ],
  comment: [
    { id: 1, userId: 2, postId: 1, text: 'gorgeous' },
    { id: 2, userId: 3, postId: 2, text: 'nice' },
    { id: 4, userId: 1, postId: 2, text: 'splended' },
    { id: 5, userId: 2, postId: 1, text: 'awesome' },
  ],
  post: [
    { id: 1, userId: 3, text: 'post 1' },
    { id: 2, userId: 2, text: 'post 1' },
  ],
}

const adapter = memAdapter(data)

const store = hedy(adapter)

const userQuery = store('user')
const commentQuery = store('comment')
const postQuery = store('post')

const commentsWithPosts = commentQuery.withRelated(hedy.belongsTo(postQuery))

userQuery.withRelated(hedy.hasMany(commentsWithPosts)).then(log)
