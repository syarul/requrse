const chk = (obj) => {
  if (obj instanceof Object && !(obj instanceof Array)) {
    const newObj = {}
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        newObj[key] = obj[key]
      }
    })
    return newObj
  }
  if(obj instanceof Array && obj.length === 1){
    return chk(obj[0])
  }
  return obj
}

const reducer = (arr) => {
  if (!arr.some(a => typeof a !== 'object')) {
    const obj = arr.reduce((acc, curr) => ({
      ...chk(acc), ...chk(curr)
    }), {})
    return Object.keys(obj).length ? obj : []
  } else {
    return arr
  }
}

module.exports = function ($vParams, params, ...currentQuery) {
  let args = []
  args = args.concat(reducer(currentQuery))
  if($vParams) {
    args.push($vParams)
  }
  args.push(params)
  return args
}
