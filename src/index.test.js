'use strict'

const expect = require('expect.js')
const hedy = require('./index')
const memAdapter = require('./adapter/mem')

const identity = val => val

describe('basics', () => {
  let store

  beforeEach(() => {
    // for testing we simply forward the query options as result of the query
    store = hedy({
      get: identity,
    })
  })

  it('should allow to create user store', async function() {
    const query = await store('user')
      .pk('hulu')
      .load()

    expect(query.pk).to.eql(['hulu'])
    expect(query.tableName).to.be('user')
  })

  it('should create a query to fetch array of items from store', async function() {
    const query = await store('user').load()
    expect(query.returnArray).to.be(true)
  })

  it('should create a query to fetch one item from store', async function() {
    const query = await store('user').get(123)
    expect(query.limit).to.be(1)
    expect(query.returnArray).to.be(false)
    expect(query.where.id).to.eql(123)
  })

  it('should create a query with where to fetch array of items from store', async function() {
    const query = await store('user')
      .where({ huhu: 'haha' })
      .load()
    expect(query.returnArray).to.be(true)
    expect(query.where.huhu).to.be('haha')
  })

  it('should create a count request', async function() {
    const query = await store('user').count()
    expect(query.count).to.be(true)
  })

  it('should create a query with map converter function', async function() {
    const query = await store('user')
      .map(user => user.id)
      .load()
    expect(query.converter).to.have.length(1)
  })

  it('should create a query with multiple converter functions', async function() {
    const getId = item => item.id
    const isFoo = item => item.isFoo
    const query = await store('user')
      .map(getId)
      .filter(isFoo)
      .load()
    expect(query.converter).to.have.length(2)

    const getIdconverter = query.converter[0]
    const isFooconverter = query.converter[1]

    expect(getIdconverter([{ id: 'huhu' }])[0]).to.be('huhu')
    expect(isFooconverter([{ isFoo: false }, { isFoo: true }])).have.length(1)
  })

  it('should be possible to add own converter functions', async function() {
    store = hedy(
      { get: identity },
      {
        methods: {
          fooify(result, arg) {
            result.foo = arg
            return result
          },
        },
      }
    )

    const query = await store('user')
      .map(identity)
      .fooify('superman')
      .load()
    expect(query.converter).to.have.length(2)
    const fooifyer = query.converter[1]
    expect(fooifyer({}).foo).to.be('superman')
  })

  it('should run query when calling `load` on query object', async function() {
    store = hedy({
      get(query) {
        expect(query.tableName).to.be('user')
        return 'user'
      },
    })
    const user = await store('user').load()
    expect(user).to.be('user')
  })

  it('should allow to catch errors thrown in runner calling `load` on query object', async function() {
    store = hedy({
      get() {
        throw new Error('eeck')
      },
    })
    try {
      await store('user')
    } catch (error) {
      expect(error.message).to.be('eeck')
    }
  })
})

describe('relations', () => {
  let store,
    data,
    commentQuery,
    userQuery,
    friendQuery,
    commentsRelation,
    userRelation,
    friends

  beforeEach(() => {
    data = {
      user: [
        { id: 1, name: 'heiner', age: 20 },
        { id: 2, name: 'klaus', age: 27 },
        { id: 3, name: 'manfred', age: 30 },
      ],
      friend: [{ user1Id: 1, user2Id: 2 }, { user1Id: 2, user2Id: 3 }],
      comment: [
        { id: 1, userId: 2, text: 'gorgeous' },
        { id: 2, userId: 3, text: 'nice' },
        { id: 4, userId: 1, text: 'splended' },
        { id: 5, userId: 2, text: 'awesome' },
      ],
    }
    store = hedy(memAdapter(data))
    commentQuery = store('comment')
    userQuery = store('user')
    friendQuery = store('friend').pk(['user1Id', 'user2Id'])

    commentsRelation = hedy.hasMany(commentQuery)
    userRelation = hedy.belongsTo(userQuery)

    friends = hedy.hasManyThrough(userQuery, friendQuery, {
      fromFk: 'user1Id',
      toFk: 'user2Id',
    })
  })

  describe('fetch stuff', () => {
    it('should allow to add hasMany relation to query', async function() {
      const users = await userQuery.withRelated(commentsRelation).load()
      expect(users[0].comments).to.eql([data.comment[2]])
    })

    it('should allow to add hasOne relation to query', async function() {
      const users = await userQuery
        .withRelated(hedy.hasOne(commentQuery))
        .load()
      expect(users[0].comment).to.eql(data.comment[2])
    })

    it('should allow to add belongsTo relation to query', async function() {
      const comments = await commentQuery.withRelated(userRelation).load()
      expect(comments[0].user).to.eql(data.user[1])
    })

    it('should allow to add manyToMany relation to query', async function() {
      const users = await userQuery.withRelated(friends).load()
      expect(users[0].friends[0].name).to.eql(data.user[1].name)
    })

    it('should allow set aliases for relation', async function() {
      const comments = await commentQuery
        .withRelated(userRelation.as('author'))
        .load()
      expect(comments[0].author).to.eql(data.user[1])
    })
  })

  describe('post stuff', () => {
    it('should allow to link two objects', async function() {
      const user1 = { id: 1 }
      const user3 = { id: 3 }
      const friendship = await friends.link(user1, user3)
      expect(friendship.user1Id).to.eql(user1.id)
      expect(friendship.user2Id).to.eql(user3.id)
      const fetchedUser = await userQuery.withRelated(friends).get(user1.id)
      expect(fetchedUser.friends).to.have.length(2)
      expect(fetchedUser.friends[1].id).to.eql(user3.id)
    })

    it('should allow to unlink two objects', async function() {
      const user1 = { id: 1 }
      const user2 = { id: 2 }
      await friends.unlink(user1, user2)
      const fetchedUser = await userQuery.withRelated(friends).get(user1.id)
      expect(fetchedUser.friends).to.have.length(0)
    })
  })
})

describe('combined pk', () => {})
