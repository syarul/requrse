import assert from 'assert'
import rq from '../libs/executor.cjs'
import { test } from './fixture/test.mjs'

const acolyte = { id: '0', progression: ['1', '4'], name: 'Acolyte' }
const priest = { id: '1', progression: ['4'], name: 'Priest' }
const squire = { id: '2', progression: ['3', '4'], name: 'Squire' }
const paladin = { id: '3', progression: ['4'], name: 'Paladin' }
const inquisitor = { id: '4', progression: [], name: 'Inquisitor' }

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

/**
 * Helper function to get a class by ID.
 */
function getClass (id) {
  // Returning a promise just to illustrate GraphQL.js's support.
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

test('Basic test', async () => {
  await rq({
    PlayerClass: {
      player: {
        name: 1
      }
    }
  }, { methods, config }).then((result) => {
    assert.deepEqual(result, { PlayerClass: { player: { name: 'Inquisitor' } } })
  })
})

// use $params when you need them
test('Basic test with $param', async () => {
  await rq({
    PlayerClass: {
      player: {
        $params: { gameId: 0 },
        name: 1
      }
    }
  }, { methods, config }).then((result) => {
    assert.deepEqual(result, { PlayerClass: { player: { name: 'Acolyte' } } })
  })
})

// optimize your query by writing efficient methods, i.e.,
// here 'progression' return this class next progression seamlessly
test('Test with computed field', async () => {
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
  }, { methods, config }).then((result) => {
    assert.deepEqual(result, {
      PlayerClass: {
        player: {
          id: '0',
          name: 'Acolyte',
          progression: [
            { name: 'Priest' },
            { name: 'Inquisitor' }
          ]
        }
      }
    })
  })
})

// you can have multiple same dataset key name by / naming
test('Test with / naming', async () => {
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
  }, { methods, config }).then((result) => {
    assert.deepEqual(result, {
      vanguard: {
        'vanguard/paladin': { name: 'Paladin' },
        'vanguard/inquisitor': { name: 'Inquisitor' }
      }
    })
  })
})

// now we expand the dataset to the inventory of the player
const healingPotion = { id: '0', effect: 'heal', dmg: 4, name: 'Healing Potion' }
const bandage = { id: '1', effect: 'heal', dmg: 1, name: 'Bandage' }
const holyWater = { id: '2', effect: 'cleansing', dmg: 2, name: 'Holy Water' }

// add relations to the inventory data
const itemData = {
  0: healingPotion,
  1: bandage,
  2: holyWater
}

// add relations to how many each class have in their inventory
const inventoryData = {
  0: [7, 1, 0],
  1: [3, 2, 2],
  2: [0, 5, 0],
  3: [1, 6, 2],
  4: [0, 0, 10]
}

/**
 * Helper function to get a item by ID.
 * Demonstrate usage of method/computed field to return value that you need,
 * in this case 'count' which came from a relational collection that store
 * the value only, you can such logic to build a powerful query for your api
 */
function getItem (count, id) {
  // Returning a promise just to illustrate query support.
  return Promise.resolve({ ...itemData[id], count })
}

function getInventory ({ id }) {
  return inventoryData[id].map(getItem)
}

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

test('Test with new relational dataset', async () => {
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
  }, extConfig).then((result) => {
    assert.deepEqual(result, {
      PlayerClass: {
        player: {
          name: 'Acolyte',
          inventory: [
            {
              id: '0',
              name: 'Healing Potion',
              count: 7
            },
            {
              id: '1',
              name: 'Bandage',
              count: 1
            },
            {
              id: '2',
              name: 'Holy Water',
              count: 0
            }
          ]
        }
      }
    })
  })
})
