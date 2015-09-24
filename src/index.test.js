'use strict';

const expect = require('expect.js');
const hedy = require('./index');
const memAdapter = require('./adapter/mem');

function noop() {}

function identity(val) {
  return val;
}

function getId(item) {
  return item.id;
}

function isFoo(item) {
  return item.isFoo;
}

describe('basics', function() {
  var store;

  beforeEach(function() {
    // for testing we simply forward the query options as result of the query
    store = hedy({
      get: identity
    });
  });

  it('should allow to create user store', function() {
    return store('user').pk('hulu').then(function(options) {
      expect(options.pk).to.be('hulu');
      expect(options.tableName).to.be('user');
    });
  });

  it('should create a query to fetch array of items from store', function() {
    return store('user').then(function(options) {
      expect(options.returnArray).to.be(true);
    });
  });

  it('should create a query to fetch one item from store', function() {
    return store('user').get(123).then(function(options) {
      expect(options.limit).to.be(1);
      expect(options.returnArray).to.be(false);
      expect(options.where.id).to.be(123);
    });
  });

  it('should create a query with where to fetch array of items from store', function() {
    return store('user').where({
      huhu: 'haha'
    }).then(function(options) {
      expect(options.returnArray).to.be(true);
      expect(options.where.huhu).to.be('haha');
    });
  });

  it('should create a count request', function() {
    return store('user').count().then(function(options) {
      expect(options.count).to.be(true);
    });
  });

  it('should create a query with map converter function', function() {
    return store('user').map(getId).then(function(options) {
      expect(options.converter).to.have.length(1);
    });
  });

  it('should create a query with multiple converter functions', function() {
    return store('user').map(getId).filter(isFoo).then(function(options) {
      expect(options.converter).to.have.length(2);

      var getIdconverter = options.converter[0];
      var isFooconverter = options.converter[1];

      expect(getIdconverter([{id: 'huhu'}])[0]).to.be('huhu');
      expect(isFooconverter([{isFoo: false}, {isFoo: true}])).have.length(1);
    });
  });

  it('should be possible to add own converter functions', function() {
    store = hedy({ get: identity }, {
      methods: {
        fooify: function(result, arg) {
          result.foo = arg;
          return result;
        }
      }
    });

    return store('user').map(identity).fooify('superman').then(function(options) {
      expect(options.converter).to.have.length(2);
      var fooifyer = options.converter[1];
      expect(fooifyer({}).foo).to.be('superman');
    });
  });

  it('should run query when calling `then` on query object', function() {
    store = hedy({
      get: function (options) {
        expect(options.tableName).to.be('user');
        return 'user';
      }
    });
    return store('user').then(function(user) {
      expect(user).to.be('user');
    });
  });

  it('should allow to catch errors thrown in runner calling `then` on query object', function() {
    store = hedy({
      get: function run() {
        throw new Error('eeck');
      }
    });
    return store('user').then(noop, function(error) {
      expect(error.message).to.be('eeck');
    });
  });

  it('should allow to catch errors thrown in runner calling `then` on query object', function() {
    store = hedy({
      get: function run() {
        throw new Error('eeck');
      }
    });
    return store('user').catch(function(error) {
      expect(error.message).to.be('eeck');
    });
  });
});

describe('relations', function() {
  var store, data, commentQuery, userQuery;

  beforeEach(function() {
    data = {
      user: [
        { id: 1, name: 'heiner', age: 20 },
        { id: 2, name: 'klaus', age: 27 },
        { id: 3, name: 'manfred', age: 30 }
      ],
      friend: [
        { user1Id: 1, user2Id: 2 },
        { user1Id: 2, user2Id: 3 }
      ],
      comment: [
        { id: 1, userId: 2, text: 'gorgeous' },
        { id: 2, userId: 3, text: 'nice' },
        { id: 4, userId: 1, text: 'splended' },
        { id: 5, userId: 2, text: 'awesome' }
      ],
    };
    store = hedy(memAdapter(data));
    commentQuery = store('comment');
    userQuery = store('user');
  });

  it('allow to add hasMany relation to query', function() {
    return userQuery.withRelated(hedy.hasMany(commentQuery)).then(function(user) {
      expect(user[0].comments).to.eql([data.comment[2]]);
    });
  });

  it('allow to add hasOne relation to query', function() {
    return userQuery.withRelated(hedy.hasOne(commentQuery)).then(function(user) {
      expect(user[0].comment).to.eql(data.comment[2]);
    });
  });

  it('allow to add belongsTo relation to query', function() {
    return commentQuery.withRelated(hedy.belongsTo(userQuery)).then(function(comments) {
      expect(comments[0].user).to.eql(data.user[1]);
    });
  });
});
