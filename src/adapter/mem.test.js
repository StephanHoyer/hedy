'use strict';

const expect = require('expect.js');
const hedy = require('../');
const memAdapter = require('./mem');

const data = {
  user: [
    { id: 1, name: 'heiner' },
    { id: 2, name: 'klaus' },
    { id: 3, name: 'manfred' }
  ],
  comment: [
    { id: 1, userId: 2, text: 'gorgeous' },
    { id: 2, userId: 3, text: 'nice' },
    { id: 4, userId: 1, text: 'splended' },
    { id: 5, userId: 2, text: 'awesome' }
  ],
};


const store = hedy(memAdapter(data));
const userQuery = store('user');
const commentStore = store('comment');

describe('mem-adapter', () => {
  it('should allow to fetch all', () => {
    return userQuery.then(users => {
      expect(users).to.eql(data.user);
    });
  });

  it('should allow to filter one', () => {
    return userQuery.where({name: 'heiner'}).then(users => {
      expect(users).to.eql([data.user[0]]);
    });
  });

  it('should allow to filter many (WHERE IN)', () => {
    return userQuery.where({name: ['klaus', 'heiner']}).then(users => {
      expect(users).to.eql([data.user[0], data.user[1]]);
    });
  });

  it('should run methods on result', () => {
    return userQuery.filter((user) => user.id > 1).then(users => {
      expect(users).to.eql([data.user[1], data.user[2]]);
    });
  });

  it('should allow to fetch relations', () => {
    return userQuery.withRelated(hedy.hasMany(commentStore)).then((users) => {
      expect(users[0].comments[0].text).to.be('splended');
    });
  });
});
