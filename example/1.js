'use strict';
var log = console.log.bind(console);

var hedy = require('../src');
var groupBy = require('lodash/collection/groupBy');
var indexBy = require('lodash/collection/indexBy');
var every = require('lodash/collection/every');
var isArray = require('lodash/lang/isArray');
var Promise = require('bluebird');

const get = key => (entity => entity[key]);

var memDB = {
  user: [
    { id: 1, name: 'heiner' },
    { id: 2, name: 'klaus' },
    { id: 3, name: 'manfred' }
  ],
  comment: [
    { id: 1, userId: 2, postId: 1, text: 'gorgeous' },
    { id: 2, userId: 3, postId: 2, text: 'nice' },
    { id: 4, userId: 1, postId: 2, text: 'splended' },
    { id: 5, userId: 2, postId: 1, text: 'awesome' }
  ],
  post: [
    { id: 1, userId: 3, text: 'post 1' },
    { id: 2, userId: 2, text: 'post 1' },
  ]
};

function runQuery(options) {
  var list = memDB[options.tableName].filter(entity => {
    return every(options.where, (value, key) => {
      if (isArray(value)) {
        return value.indexOf(entity[key]) >= 0;
      }
      return entity[key] === value;
    });
  });
  return Promise.all(options.withRelated.map(relation => relation(list)))
    .then(() => Promise.reduce(options.converter, (list, handler) => handler(list), list));
}

var store = hedy(runQuery, {
  methods: {
    groupBy: groupBy,
    indexBy: indexBy
  }
});

var userQuery = store('user');
var commentQuery = store('comment');
var postQuery = store('post');

function postsOfComments(comments) {
  return postQuery
    .where({ id: comments.map(get('postId')) })
    .indexBy('id')
    .then(postsByPostId => {
      comments.map(comment => {
        comment.post = postsByPostId[comment.postId];
        return comment;
      });
    });
}

function commentsOfUsers(users) {
  return commentQuery
    .where({ userId: users.map(get('id')) })
    .withRelated(postsOfComments)
    .groupBy('userId')
    .then(commentsByUserId => {
      users.map(user => {
        user.comments = commentsByUserId[user.id];
        return user;
      });
    });
}

userQuery.withRelated(commentsOfUsers).then(log);

