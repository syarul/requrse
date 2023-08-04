const queryExec = require('../../libs/executor')

const starwarsData = require('./starwarsData.js')

const config = (param) => starwarsData[param]

const methods = {
  hero: 'getHero',
  friends: 'getFriends',
  human: 'getHuman',
  droid: 'getDroid',
  secretBackstory () {
    throw new Error('secretBackstory is secret.')
  }
}

module.exports = (query) => queryExec(query, { methods, config })
