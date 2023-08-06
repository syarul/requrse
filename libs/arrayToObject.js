const checkEntry = require('./checkEntry')

const arrayToObject = (arr) => {
  if (Array.isArray(arr) && !checkEntry(arr)) {
    if (arr.length === 1 && Array.isArray(arr[0]) && checkEntry(arr[0])) {
      return arrayToObject(arr.flat())
    }
    return arr.map(arrayToObject)
  }
  if (checkEntry(arr)) {
    let obj
    const checkUniq = arr.map(i => {
      if (i && i instanceof Object) {
        return i[0]
      }
      return false
    }).filter(f => f !== undefined)
    const unique = checkUniq.length === [...new Set(checkUniq)].length
    arr.forEach((item) => {
      if (item && item[0]) {
        if (unique) {
          obj = obj || {}
          obj[item[0]] = arrayToObject(item[1])
        } else {
          obj = obj || []
          obj.push({ [item[0]]: arrayToObject(item[1]) })
        }
      }
    })
    return obj
  }
  return arr
}

module.exports = arrayToObject
