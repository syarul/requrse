module.exports = (v) => Array.isArray(v) && Array.isArray(v[0]) && v[0].length === 2 && typeof v[0][0] === 'string'
