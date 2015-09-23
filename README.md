# hedy - a functional ORM

[![Join the chat at https://gitter.im/StephanHoyer/hedy](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/StephanHoyer/hedy?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Let's face it: Node's ORMs are crap. Mostly at least. But JavaScript is an
awesome language. So why? Because we did it wrong. To much class-ish stuff like
backbone. And prototypal inheritance, which is bad.

We want to fix this!

## Initialisation

```javascript
var hedy = require('hedy');
var mem = require('hedy/adapter/mem');

var store = hedy(adapter);
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
var userQuery = store('user') // 'user' is the tablename
```

The `query` is a monad-ish structure. You can call methods on it and it returns
another query with the method applied. The original query remains untouched.
Unter the hood this is done using
[immutable.js](https://facebook.github.io/immutable-js/).

## Fetch array of things

```javascript
userQuery.where(where).then(function(users) {
  // Array of POJOs containing user data
});
```

The where can be omitted, in this case all items where fetched. The query will
only run, if you call `then` on it. This allows lazily fetch things.

There are also some utility functions that might be usefull. They can be called
on the query without actually fetching it.

```javascript
userQuery.where(where).map(fn1).filter(fn2).then(function(users) {
  // Array of POJOs containing user data
});
```

The map and filter will be applied onto the fetched collection in the order as
they are applied to the query. They may return a promise.

Because all that is lazy you might do the following:

```javascript
var usersWithLongNames = userQuery.filter(function(user) {
  return user.name.length > 10;
})

var femaleUsersWithLongNames = usersWithLongNames.filter(function(user) {
  return user.gender === 'female'
})

var kidsWithLongNames = usersWithLongNames.filter(function(user) {
  return user.age < 10;
})

var namesOfKidsWithLongNames = kidsWithLongNames.map(function(user) {
  return user.name;
});

// if you now need the names of the kids:
namesOfKidsWithLongNames.then(function(names) {
  // there you have it.
});
```

Sure, in some of those cases the database might do the heavy lifting, but there are
cases where code can express much more then a database query. Also code reuse
and composition can lead to great improvements here.

Currently there are only a few methods build in: `map`, `reduce`, `groupBy`,
`indexBy`. It's easy to add your own method there. In the upper example lodashs
`pluck` might be a good choice to get the user name:

```javascript
var store = hedy(adapter, {
  methods: {
    pluck: require('lodash/collection/pluck');
  }
});
```

In this case we add the `pluck`-function of
[lodash](https://lodash.com/docs#pluck). Now we can do

```javascript
userQuery.pluck('name').then(function(usernames) {
  // usernames = ['heiner', 'klaus', 'birgit'];
});
```

## Fetch one thing

```javascript
userQuery.get(id).then(function(user) {
  // POJO containing user data
});
```

## Create one thing

```javascript
userQuery.save(data).then(function(user) {
  // POJO containing user data
});
```

## Update one thing

```javascript
userQuery.save(id, data).then(function(user) {
  // POJO containing user data
});
```

## Relations

Relation are a key part of ORMs. In most ORMs relations can only be in the same
database. *Hedy* as a different approach on this. Relations are defined as
querys. Let's look at an example:

```javascript
var data = {
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
  ]
};
var adapter = memAdapter(data);
var store = hedy(adapter);

var userQuery = store('user');
var commentQuery = store('comment');
```

Here we have a memory db containing users and their comments.

To fetch the users with the comments we do:

```javascript
userQuery.withRelated(hedy.hasMany(commentQuery)).then(log);
```

As you see, we use a helper to declare a to-many-relation and give a query as
parameter. The query does not have to request to the same database, so this is
perfectly possible.

```javascript
var memQuery = hedy(memAdapter(data));
var pgQuery = hedy(pgAdapter(config));

var userQuery = memQuery('user');
var commentQuery = pgQuery('comment');

userQuery.withRelated(hedy.hasMany(commentQuery)).then(log);
```

For a more advanced example see the examples in the examples folder.

## Current state

This is pretty much WIP. The basics are done. Now it's time to write the
adapters. First one will be a memory-adapter. Then we first add a postgres
adapter since this is the DB we're using in out project.

Hope you like it.

If you have any ideas, feel free to create a PR/Issue.
