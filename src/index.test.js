
var fnORM = require('./index');

describe('init', function() {
  it('should be initializable', function() {
    var store = fnORM({
      client: 'sqlite3',
      connection: {
        filename: "/tmp/fnorm.test.sqlite"
      }
    });
  });
});
