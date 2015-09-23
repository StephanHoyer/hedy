'use strict';

const expect = require('expect.js');
const hedy = require('../');
const memAdapter = require('./mem');


describe('mem-adapter', () => {
  var data, store, userQuery, commentQuery;

  beforeEach(() => {
    data = {
      user: [
        { id: 1, name: 'heiner', age: 20 },
        { id: 2, name: 'klaus', age: 27 },
        { id: 3, name: 'manfred', age: 30 }
      ],
      comment: [
        { id: 1, userId: 2, text: 'gorgeous' },
        { id: 2, userId: 3, text: 'nice' },
        { id: 4, userId: 1, text: 'splended' },
        { id: 5, userId: 2, text: 'awesome' }
      ],
    };
    store = hedy(memAdapter(data));
    userQuery = store('user');
    commentQuery = store('comment');

  });

  describe('get', () => {
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
      return userQuery.withRelated(hedy.hasMany(commentQuery)).then((users) => {
        expect(users[0].comments[0].text).to.be('splended');
      });
    });

    it('should fetch one by id', () => {
      return userQuery.get(3).then((user) => {
        expect(user).to.eql(data.user[2]);
      });
    });
  });

  describe('create', () => {
    it('should create item with data from query', () => {
      return userQuery.post({
        id: 4,
        name: 'frieda'
      }).then(function(savedFrieda) {
        expect(savedFrieda.name).to.be('frieda');
        return userQuery.get(4);
      }).then(function(friedaFromDb) {
        expect(friedaFromDb.name).to.be('frieda');
        expect(friedaFromDb.age).to.be(undefined);
      });
    });
  });

  describe('update', () => {
    it('should replace data from query', () => {
      return userQuery.put(2, {
        id: 2,
        name: 'frieda'
      }).then(function(savedFrieda) {
        expect(savedFrieda.name).to.be('frieda');
        return userQuery.get(2);
      }).then(function(friedaFromDb) {
        expect(friedaFromDb.name).to.be('frieda');
        expect(friedaFromDb.age).to.be(undefined);
      });
    });

    it('should patch data from query', () => {
      return userQuery.patch(2, {
        age: 100
      }).then(function(patchedUser) {
        expect(patchedUser.name).to.be('klaus');
        expect(patchedUser.age).to.be(100);
        return userQuery.get(2);
      }).then(function(patchedUserFromDb) {
        expect(patchedUserFromDb.name).to.be('klaus');
        expect(patchedUserFromDb.age).to.be(100);
      });
    });
  });

});
