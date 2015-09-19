var expect = require('expect.js');
var fnORM = require('./index');
var Promise = require('bluebird');

function identity(val) {
  return val;
}

function getId(item) {
  return item.id;
}

function isFoo(item) {
  return item.isFoo;
}

describe('init', function() {
  var store;

  beforeEach(function() {
    // for testing we simple forward the query options as result of the query
    store = fnORM(identity);
  });

  it('should allow to create user store', function() {
    return store('user', {
      pk: 'hulu'
    }).then(function(options) {
      expect(options.get('tableOptions').get('pk')).to.be('hulu');
      expect(options.get('tableName')).to.be('user');
    });
  });

  it('should create a query to fetch array of items from store', function() {
    return store('user').then(function(options) {
      expect(options.get('returnArray')).to.be(true);
    });
  });

  it('should create a query to fetch one item from store', function() {
    return store('user').get(123).then(function(options) {
      expect(options.get('limit')).to.be(1);
      expect(options.get('returnArray')).to.be(false);
      expect(options.getIn(['where', 'id'])).to.be(123);
    });
  });

  it('should create a query with where to fetch array of items from store', function() {
    return store('user').where({
      huhu: 'haha'
    }).then(function(options) {
      expect(options.get('returnArray')).to.be(true);
      expect(options.getIn(['where', 'huhu'])).to.be('haha');
    });
  });

  it('should create a count request', function() {
    return store('user').count().then(function(options) {
      expect(options.get('count')).to.be(true);
    });
  });

  it('should create a query with map functions', function() {
    return store('user').map(getId).then(function(options) {
      expect(options.get('handler').size).to.be(1);
    });
  });

  it('should create a query with multiple functions', function() {
    return store('user').map(getId).filter(isFoo).then(function(options) {
      expect(options.get('handler').size).to.be(2);

      var getIdHandler = options.getIn(['handler', 0]);
      var isFooHandler = options.getIn(['handler', 1]);

      expect(getIdHandler([{id: 'huhu'}])[0]).to.be('huhu');
      expect(isFooHandler([{isFoo: false}, {isFoo: true}])).have.length(1);
    });
  });

  it('should be possible to add own handler functions', function() {
    var query = store('user');

    query.fooify = query._attachHandler(function(result, arg) {
      result.foo = arg;
      return result;
    });

    return query.fooify('superman').then(function(options) {
      expect(options.get('handler').size).to.be(1);
      var fooifyer = options.getIn(['handler', 0]);
      expect(fooifyer({}).foo).to.be('superman');
    });
  });

  it('should run query when calling then on query object', function() {
    store = fnORM(function run(options) {
      expect(options.get('tableName')).to.be('user');
      return 'user';
    });
    return store('user').then(function(user) {
      expect(user).to.be('user');
    });
  });

});
