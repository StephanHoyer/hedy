# hedy - a functional ORM

Let's face it: Node's ORMs are crap. Mostly at least. But JavaScript is an awesome language. So why. Because we did it wrong. To much class-ish stuff like backbone.

We want to fix this. This is the first idea for the API:

## Initialisation
```javascript
var hedy = require('hedy');

var store = hedy(runQueryFn);
```

The `runQueryFn` is the function that is called when a query is fired. It gets
the query options object as parameter. This is a database-specific function. We
will create adapters for various databases that contain the specic operations to
run the given query. See the example in the example folder how we plan to
implement this.

## Creating Models/Collections/Whatever-you-call-them

... , we call it query.

```javascript
var query = store('user') // 'user' is the tablename
```

The `query` is a monad-ish structure. You can call methods on it and it returns
another query with the method applied. The original query remains untouched.
Unter the hood this is done using
[immutable.js](https://facebook.github.io/immutable-js/).

## Fetch array of things

```javascript
userStore.where(where).map(fn).filter(fn).then(function(users) {
  // Array of POJOs containing user data
});
```

The map and filter will be applied onto the fetched collection in the order as
they are applied to the query. They may return a promise.

It's easy to add your own method there:

```javascript
var groupBy = require('lodash/collection/groupBy');

var store = fnORM(runQueryFn, {
  methods: {
    groupBy: groupBy
  }
});
```

In this case we add the `groupBy`-function of
[lodash](https://lodash.com/docs#groupBy). Now we can do

```javascript
userStore.groupBy('id').then(function(usersById) {
  // usersById = {
  //   1: [ { id: 1, name: 'heiner' } ],
  //   2: [ { id: 2, name: 'klaus' } ],
  //   3: [ { id: 3, name: 'birgit' } ],
  // }
});
```

## Fetch one thing

```javascript
userStore.get(id).then(function(user) {
  // POJO containing user data
});
```

## Create one thing

```javascript
userStore.save(data).then(function(user) {
  // POJO containing user data
});
```

## Update one thing

```javascript
userStore.save(id, data).then(function(user) {
  // POJO containing user data
});
```

## Relations

Fetching relations is pretty db-dependent. We try to abstract this out to
adapters.

An adapter will be a `runQueryFn` together with the specific way to fetch the
related objects. This way we are able to even fetch relations beween different
databases or even database-types!

See the first example in the example folder how we plan to implement this.

```javascript
postStore.get(123).withRelated(user, comments).then(function(post) {
  // post = {
  //   titel: 'hurray'
  //   user: {
  //     name: 'Mister T'
  //   },
  //   comments: [
  //     { text: 'awesome' },
  //     { text: '+1' }
  //   ]
  // };
});
```

## Current state

This is pretty much WIP. The basics are done. Now it's time to write the
adapters. First one will be a memory-adapter. Then we first add a postgres
adapter since this is the DB we're using in out project.

Hope you like it.

If you have any ideas, feel free to create a PR/Issue.
