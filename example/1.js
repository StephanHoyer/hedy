var fnORM = require('../src');

var memDB = {
  user: [
    { id: 1, name: 'heiner' },
    { id: 2, name: 'klaus' },
    { id: 3, name: 'manfred' }
  ],
  comments: [
    { id: 1, userId: 2, text: 'gorgeous' },
    { id: 2, userId: 3, text: 'nice' },
    { id: 4, userId: 1, text: 'splended' },
    { id: 5, userId: 2, text: 'awesome' },
  ]
};

function query(options) {
  console.log(options);
  return memDB[options.tableName];
}

store = fnORM(query);

store('user').withRelated(comments).then(function(user) {
  console.log(user);
});

function comments(users) {
  return store('comment')
    .where({ userId: users.map(getId) })
    .groupBy('userId')
    .then(function(commentsByUserId) {
      return users.map(function(user) {
        user.comments = commentsByUserId[user.id];
        return user;
      });
    });
}
