var expect = require('expect.js');
var fnORM = require('./index');

describe('init', function() {
  var store;

  beforeEach(function() {
    var dbConfig = {
      client: 'sqlite3',
      connection: {
        filename: "/tmp/fnorm.test.sqlite"
      }
    };
    store = fnORM(dbConfig);
  });

  it('should allow to create user store', function() {
    var query = store('user', {
      pk: 'hulu'
    });
    expect(query._options.get('tableOptions').get('pk')).to.be('hulu');
    expect(query._options.get('tableName')).to.be('user');
  });

  it('should create a query to fetch array of items from store', function() {
    var query = store('user');
    expect(query._options.get('returnArray')).to.be(true);
  });

  it('should create a query to fetch one item from store', function() {
    var query = store('user').get(123);
    expect(query._options.get('limit')).to.be(1);
    expect(query._options.get('returnArray')).to.be(false);
    expect(query._options.getIn(['where', 'id'])).to.be(123);
  });

  it('should create a query with where to fetch array of items from store', function() {
    var query = store('user').where({
      huhu: 'haha'
    });
    expect(query._options.get('returnArray')).to.be(true);
    expect(query._options.getIn(['where', 'huhu'])).to.be('haha');
  });

  it('should create a query with map/filter funcions', function() {
    function getId(item) { return item.id; }
    function isFoo(item) { return item.isFoo; }

    var query = store('user').map(getId);

    expect(query._options.get('handler').size).to.be(1);

    query = query.filter(isFoo);
    expect(query._options.get('handler').size).to.be(2);

    var getIdHandler = query._options.getIn(['handler', 0]);
    var isFooHandler = query._options.getIn(['handler', 1]);

    expect(getIdHandler([{id: 'huhu'}])[0]).to.be('huhu');
    expect(isFooHandler([{isFoo: false}, {isFoo: true}])).have.length(1);
  });

  it('should be possible to add own handler functions', function() {
    var query = store('user');
    query.fooify = query._attachHandler(function(result, arg) {
      result.foo = arg;
      return result;
    });

    query = query.fooify('superman');
    expect(query._options.get('handler').size).to.be(1);

    var fooifyer = query._options.getIn(['handler', 0]);

    expect(fooifyer([{}]).foo).to.be('superman');
  });

});
