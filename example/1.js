var fnORM = require('../src');
var groupBy = require('lodash/collection/groupBy');
var Promise = require('bluebird');

var memDB = {
  user: [
    { id: 1, name: 'heiner' },
    { id: 2, name: 'klaus' },
    { id: 3, name: 'manfred' }
  ],
  comment: [
    { id: 1, userId: 2, text: 'gorgeous' },
    { id: 2, userId: 3, text: 'nice' },
    { id: 4, userId: 1, text: 'splended' },
    { id: 5, userId: 2, text: 'awesome' },
  ]
};

function runQuery(options) {
  var list = memDB[options.tableName];
  return Promise.all(options.withRelated.map(function(relation) {
    return relation(list);
  })).then(function() {
    return Promise.reduce(options.handler, function(list, handler) {
      return handler(list);
    }, list);
  });
}

store = fnORM(runQuery, {
  methods: {
    groupBy: groupBy
  }
});

var userQuery = store('user');
var commentQuery = store('comment');

userQuery.withRelated(comments).then(function(user) {
  console.log(user);
});

function getId(entity) {
  return entity.id;
}

function comments(users) {
  return commentQuery
    .where({ userId: users.map(getId) })
    .groupBy('userId')
    .then(function(commentsByUserId) {
      return users.map(function(user) {
        user.comments = commentsByUserId[user.id];
        return user;
      });
    });
}
