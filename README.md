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

## Advance usage
A proper query should do more, to demystify the capability of this library, create a few data samples, you can imagine this as a setup that your database may have.

```js
const acolyte = { id: '0', progression: ['1', '4'], name: 'Acolyte' }
const priest = { id: '1', progression: ['4'], name: 'Priest' }
const squire = { id: '2', progression: ['3', '4'], name: 'Squire' }
const paladin = { id: '3', progression: ['4'], name: 'Paladin' }
const inquisitor = { id: '4', progression: [], name: 'Inquisitor' }

// we also create the relations between them
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

Then configure `reQurse` to use these methods
```js
const confParams = {
  getPlayer, getClass, getProgression, getSupport, getVanguard
}

const config = (param) => confParams[param]

const methods = {
  player: 'getPlayer',
  class: 'getClass',
  progression: 'getProgression',
  support: 'getSupport',
  vanguard: 'getVanguard'
}
```

Simple usage
```js
await rq({
  PlayerClass: {
    player: {
      name: 1
    }
  }
}, { methods, config }).then(console.log)
// { PlayerClass: { player: { name: 'Inquisitor' } } }
```

Use `$params` to filter result
```js
await rq({
  PlayerClass: {
    player: {
      $params: { gameId: 0 },
      name: 1
    }
  }
}, { methods, config }).then(console.log)
// { PlayerClass: { player: { name: 'Acolyte' } } }
```

Optimize your query by writing efficient methods, i.e., here `progression` return the class next progression seamlessly
```js
await rq({
  PlayerClass: {
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
//   PlayerClass: {
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
```

You can have multiple same dataset key name by `/` naming
```js
await rq({
  vanguard: {
    'vanguard/paladin': {
      $params: { id: 3 },
      name: 1
    },
    'vanguard/inquisitor': {
      $params: { id: 4 },
      name: 1
    }
  }
}, { methods, config }).then(console.log)
// {
//   vanguard: {
//     'vanguard/paladin': { name: 'Paladin' },
//     'vanguard/inquisitor': { name: 'Inquisitor' }
//   }
// }
```

Now we expand the dataset to the inventory of the player
```js
const healingPotion = { id: '0', effect: 'heal', dmg: 4, name: 'Healing Potion' }
const bandage = { id: '1', effect: 'heal', dmg: 1, name: 'Bandage' }
const holyWater = { id: '2', effect: 'cleansing', dmg: 2, name: 'Holy Water' }

// add relations to the inventory data
const itemData = {
  0: healingPotion,
  1: bandage,
  2: holyWater
}

// add relations to how many each class have these items in their inventory
const inventoryData = {
  0: [7, 1, 0],
  1: [3, 2, 2],
  2: [0, 5, 0],
  3: [1, 6, 2],
  4: [0, 0, 10]
}
```

Demonstrate usage of method/computed field to return value that you need, in this case `count` which came from a relational collection that store the value only, you can use such logic to build a powerful query for your api.
```js
/**
 * Helper function to get an item by ID.
 */
function getItem (count, id) {
  // Returning a promise just to illustrate query support.
  return Promise.resolve({ ...itemData[id], count })
}

/**
 * Allows us to query for the player class inventoryData.
 */
function getInventory ({ id }) {
  return inventoryData[id].map(getItem)
}
```

Extends the reQurse methods/config
```js
const extConfig = {
  methods: {
    ...methods,
    item: 'getItem',
    inventory: 'getInventory'
  },
  config: (param) => ({
    ...confParams,
    getItem,
    getInventory
  })[param]
}
```

Now see how it perform!
```js
await rq({
  PlayerClass: {
    player: {
      $params: { gameId: 0 },
      name: 1,
      inventory: {
        id: 1,
        name: 1,
        count: 1
      }
    }
  }
}, extConfig).then(console.log)
// {
//   PlayerClass: {
//     player: {
//       name: "Acolyte",
//       inventory: [
//         {
//           id: "0",
//           name: "Healing Potion",
//           count: 7
//         },
//         {
//           id: "1",
//           name: "Bandage",
//           count: 1
//         },
//         {
//           id: "2",
//           name: "Holy Water",
//           count: 0
//         }
//       ]
//     }
//   }
// }
```
You can also return as dataUrl
```js
await rq({
  PlayerClass: {
    player: {
      $params: { gameId: 0 },
      name: 1,
      inventory: {
        id: 1,
        name: 1,
        count: 1
      }
    }
  }
}, { ...extConfig, dataUrl: 'PlayerClass/player/inventory' }).then(console.log)
// [
//   {
//     id: '0',
//     name: 'Healing Potion',
//     count: 7
//   },
//   {
//     id: '1',
//     name: 'Bandage',
//     count: 1
//   },
//   {
//     id: '2',
//     name: 'Holy Water',
//     count: 0
//   }
// ]
```

## More Samples
You can check [samples](https://github.com/syarul/requrse/blob/main/samples) folder to see more usage cases with [Mongoose](https://github.com/syarul/requrse/blob/main/samples/mongoose), [Redis](https://github.com/syarul/requrse/blob/main/samples/redis) and the [Starwars](https://github.com/syarul/requrse/blob/main/samples/starwars) examples.