# fnORM - a functional ORM

Let's face it: Node's ORMs are crap. Mostly at least. But JavaScript is an awesome language. So why. Because we did it wrong. To much class-ish stuff like backbone.

We want to fix this. This is the first idea for the API:

## Initialisation
```javascript
var fnORM = require('fnorm');

var store = fnORM({
  //db config goes here
});
```

## Creating Models/Collections/Whatever-you-call-them

... , we call it `store`.

```javascript
var userStore = store('user') // 'user' is the tablename
```

## Fetch array of things

```javascript
userStore.where(where).map(fn).filter(fn).then(function(users) {
  // Array of POJOs containing user data
});
```

We will support most of the lodash collections stuff. But lazy!

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

```javascript
postStore = store('post', {
  relations: {
    user: function(post) {
      return userStore.get(post.userId);
    },
    comments: function(post) {
      return commentStore.where({
        postId: post.id
      });
    }
  }
})

postStore.get(123).with('user', 'comments').then(function(post) {
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

Hope you like it.

If you have any ideas, feel free to create a PR/Issue.
