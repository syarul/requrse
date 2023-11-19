import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const rq = require('../libs/executor')

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