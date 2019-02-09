# hedy - a functional ORM

[![Join the chat at https://gitter.im/StephanHoyer/hedy](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/StephanHoyer/hedy?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/StephanHoyer/hedy.svg)](https://travis-ci.org/StephanHoyer/hedy)

Let's face it: Node's ORMs are crap. Mostly at least. But JavaScript is an
awesome language. So why? Because we did it wrong. To much class-ish stuff like
backbone. And prototypal inheritance, which is bad.

We want to fix this!

## Initialisation

```javascript
const hedy = require('hedy')
const mem = require('hedy/adapter/mem')

const store = hedy(adapter)
```

The `adapter` is a function that is called when a query is fired. It gets
the query options-object as parameter. This is a database-specific function. In
this case we user the build in memory adapter. In the future we want to create
adapter for various databases. The goal is that it's really easy to create one for you
specific datastore.

See the existing adapters how this works.

## Creating Models/Collections/Whatever-you-call-them

..., we just call it `query`.

```javascript
const userQuery = store('user') // 'user' is the tablename
```

The `query` is a monad-ish structure. You can call methods on it and it returns
another query with the method applied. The original query remains untouched.
Unter the hood this is done using
[patchinko](https://github.com/barneycarroll/patchinko).

## Fetch array of things

```javascript
// Array of POJOs containing user data
const users = await userQuery.where(where).load()
```

The where can be omitted, in this case all items where fetched. The query will
only run, if you call `load` on it.

There are also some utility functions that might be usefull. They can be called
on the query without actually fetching it.

```javascript
// Array of POJOs containing user data
const users = await userQuery
  .where(where)
  .map(fn1)
  .filter(fn2)
  .load()
})
```

The `map` and `filter` will be applied onto the fetched collection in the order as
they are applied to the query. They may return a promise.

Because all that is lazy you might do the following:

```javascript
const usersWithLongNames = userQuery.filter(user => user.name.length > 10)

const femaleUsersWithLongNames = usersWithLongNames.filter(
  user => user.gender === 'female'
)

const kidsWithLongNames = usersWithLongNames.filter(user => user.age < 10)

const namesOfKidsWithLongNames = kidsWithLongNames
  .columns(['name'])
  .map(user => user.name)

// if you now need the names of the kids:
// there you have it.
const names = await namesOfKidsWithLongNames.load()
```

Sure, in some of those cases the database might do the heavy lifting, but there are
cases where code can express much more then a database query. Also code reuse
and composition can lead to great improvements here.

Currently there are only a few methods build in: `map`, `reduce`, `groupBy`,
`indexBy`. It's easy to add your own method there. In the upper example lodashs
`pluck` might be a good choice to get the user name:

```javascript
const store = hedy(adapter, {
  methods: {
    pluck: require('lodash/collection/pluck'),
  },
})
```

In this case we add the `pluck`-function of
[lodash](https://lodash.com/docs#pluck). Now we can do

```javascript
const usernames = await .pluck('name').load()
// usernames = ['heiner', 'klaus', 'birgit']
```

## Fetch one thing by pk

```javascript
// POJO containing user data
const user = await userQuery.get(id)
```

## Fetch one first

```javascript
// POJO containing user data
const user = await userQuery.where(where).first()
```

## select columns (with aliasing)

```javascript
// POJO containing username under `localName`
const user = await userQuery
  .columns({ localName: columnNameInDb })
  .where(where)
  .get(1)
```

## Counting

```javascript
// POJO containing a number
const count = await userQuery.count()
```

## Create one thing

```javascript
// POJO containing user data
const user = await userQuery.post(data)
```

## Update one thing

```javascript
// POJO containing user data
const user = await userQuery.put(id, data)
})
```

You can also patch stuff:

```javascript
// POJO containing user data
const user = await userQuery.patch(id, data)
```

## delete one thing

```javascript
await userQuery.del(id)
```

## Relations

Relations are a key part of ORMs. In most ORMs relations can only be in the same
database. _Hedy_ as a different approach on this. Relations are defined as
querys. Let's look at an example:

```javascript
const data = {
  user: [
    { id: 1, name: 'heiner' },
    { id: 2, name: 'klaus' },
    { id: 3, name: 'manfred' },
  ],
  friend: [{ user1Id: 1, user2Id: 2 }, { user1Id: 2, user2Id: 3 }],
  comment: [
    { id: 1, userId: 2, text: 'gorgeous' },
    { id: 2, userId: 3, text: 'nice' },
    { id: 4, userId: 1, text: 'splended' },
    { id: 5, userId: 2, text: 'awesome' },
  ],
}
const adapter = memAdapter(data)
const store = hedy(adapter)

const userQuery = store('user')
const commentQuery = store('comment')
const friendQuery = store('friend')
```

Here we have a memory db containing users and their comments.

To fetch the users with the comments we do:

```javascript
userQuery.withRelated(hedy.hasMany(commentQuery)).then(users => ...)
```

As you see, we use a helper to declare a to-many-relation and give a query as
parameter. The query does not have to request to the same database, so this is
perfectly possible.

```javascript
const memQuery = hedy(memAdapter(data))
const pgQuery = hedy(pgAdapter(config))

const userQuery = memQuery('user')
const commentQuery = pgQuery('comment')

userQuery.withRelated(hedy.hasMany(commentQuery)).then(users => ...)
```

For a more advanced example see the examples in the examples folder.

### Has-many

```javascript
const users = await userQuery.withRelated(hedy.hasMany(commentQuery)).load()
```

### Has-one

**TODO** Add example

### Belongs-to

```javascript
const comments = await commentQuery
  .withRelated(hedy.belongsTo(userQuery))
  .load()
```

### Many-to-many

```javascript
const users = await user
  .withRelated(hedy.hasManyThrough(userQuery, friendQuery))
  .load()
```

For _many-to-many_-Relations there are two helper functions to create and delete
them:

```javascript
const friendship = await friends.link(userA, userB)
await friends.unlink(userA, userB)
```

## Current state

This is pretty much WIP. The basics are done. Now it's time to write the
adapters. First one will be a memory-adapter. Then we first add a postgres
adapter since this is the DB we're using in our project.

Hope you like it.

If you have any ideas, feel free to create a PR/Issue.

## links

- Pretty similar attempt to _hedy_ by the bookshelf maintainer: https://github.com/rhys-vdw/data-mapper
