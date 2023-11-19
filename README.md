# reQurse
Lightweight driven query language

[![NPM Version](https://img.shields.io/npm/v/requrse.svg)](https://www.npmjs.com/package/requrse)
[![requrse CI](https://github.com/syarul/requrse/actions/workflows/main-ci.yml/badge.svg)](https://github.com/syarul/requrse/actions/workflows/main-ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/syarul/requrse/badge.svg?branch=main)](https://coveralls.io/github/syarul/requrse?branch=main)

## What is reQurse
**reQurse** introduces an innovative approach that overcomes the complexities of CRUD operations. The focus is on delivering a streamlined and efficient CRUD library solution, simplifying API development, and effortlessly handling complex data management tasks. **reQurse** utilized JSON-based queries, allows multi-tenant API sources, avoid writing lengthy procedural APIs and truly embrace Javascript core philosophy as OOP language. This approach promotes a modular and streamlined code structure, retaining the complexity of `Object` tree while enhancing flexibility and maintainability.

Here's the first example to get you started. [Try it here](https://codepen.io/syarul/pen/xxmLMVP)—no build step required!

> This library take some inspirations from NextQL and GraphQL

## Usage

A basic usage of reQurse.
```javascript
import rq from 'requrse'

rq(query, { methods, config })
```
- **query**: *(object)* ***required*** JSON like query.
- **methods**: *(object)* ***required*** define methods/computed fields that exist in the query.
- **config**: *(object)* ***optional*** extend and added parameterize control over methods.
```js
await rq({
  Test: {
    test: {
      greeting: '*'
    }
  }
},
{
  methods: {
    greeting () {
      return 'hello world'
    }
  }
}).then(console.log, console.error)
// { Test: { test: { greeting: 'hello world' } } }
```

A proper query should do more than just this, to demystify the capability of this library, create a few data samples

```js
const acolyte = { id: '0', progression: ['1', '4'], name: 'Acolyte' }
const priest = { id: '1', progression: ['4'], name: 'Priest' }
const squire = { id: '2', progression: ['3', '4'], name: 'Squire' }
const paladin = { id: '3', progression: ['4'], name: 'Paladin' }
const inquisitor = { id: '4', progression: [], name: 'Inquisitor' }

// we also create the relation between them
const supportData = {
  0: acolyte,
  1: priest,
  4: inquisitor
}

const vanguardData = {
  2: squire,
  3: paladin,
  4: inquisitor
}
```

Then the helper functions to access these data
```js
/**
 * Helper function to get a class by ID.
 */
function getClass (id) {
  // Returning a promise just to illustrate query support.
  return Promise.resolve(supportData[id] || vanguardData[id])
}
/**
 * Allows us to query for a classes's progression.
 */
function getProgression (classes) {
  return classes.progression.map(id => getClass(id))
}
/**
 * Allows us to query for the support class with the given id.
 */
function getSupport (id) {
  return supportData[id]
}
/**
 * Allows us to query for the vanguard class with the given id.
 */
function getVanguard (id) {
  return vanguardData[id]
}
/**
 * Allows us to query for the player class by gameId.
 */
function getPlayer (gameId) {
  if (gameId === 0) {
    return acolyte
  }
  return inquisitor
}
```

Then configure `requrse` to use these methods
```js
const config = (param) => ({
  getPlayer, getClass, getProgression, getSupport, getVanguard
}[param])

const methods = {
  player: 'getPlayer',
  class: 'getClass',
  progression: 'getProgression',
  support: 'getSupport',
  vanguard: 'getVanguard'
}

await rq({
  class: {
    player: {
      name: 1
    }
  }
}, { methods, config }).then(console.log)
// { class: { player: { name: 'Inquisitor' } } }

await rq({
  class: {
    player: {
      $params: { gameId: 0 },
      name: 1
    }
  }
}, { methods, config }).then(console.log)
// { class: { player: { name: 'Acolyte' } } }

await rq({
  class: {
    player: {
      $params: { gameId: 0 },
      id: 1,
      name: 1,
      progression: {
        name: 1
      }
    }
  }
}, { methods, config }).then(console.log)
// {
//   class: {
//     player: {
//       id: '0',
//       name: 'Acolyte',
//       progression: [
//         { name: 'Priest' },
//         { name: 'Inquisitor' }
//       ]
//     }
//   }
// }

await rq({
  vanguard: {
    'vanguard/paladin': {
      $params: { id: 3 },
      name: 1
    }
  }
}, { methods, config }).then(console.log)
// { vanguard: { 'vanguard/paladin': { name: 'Paladin' } } }
```


## Samples
You can check [samples](https://github.com/syarul/requrse/blob/main/samples) folder to see more usage cases with [Mongoose](https://github.com/syarul/requrse/blob/main/samples/mongoose), [Redis](https://github.com/syarul/requrse/blob/main/samples/redis) and the [Starwars](https://github.com/syarul/requrse/blob/main/samples/starwars) examples.