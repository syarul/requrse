const executeQuery = require('./executeQuery')
const arrayToObject = require('./arrayToObject')

const catcher = (e) => e(this)

module.exports = (query, opts) => {
  try {
    return executeQuery(query, null, opts).then(arrayToObject)
  } catch (error) {
    return catcher.bind(error)
  }
}
