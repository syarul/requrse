import assert from 'assert'
import mongoose from 'mongoose'

import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const requrseMongoose = require('./mongoose.middleware')

mongoose.Promise = global.Promise

mongoose
  .connect('mongodb://localhost:27017/requrse')
  .catch(error => {
    console.log(error)
    process.exit(1)
  })

const test = (result, expected, msg = '') => {
  try {
    assert.deepEqual(result, expected)
    console.log(`\r\n:: ${msg} ::\r\n`)
  } catch(e) {
    console.log(`\r\n:: Test failed: ${msg} ::`)
    console.error(e)
  }
}

/**
 * This is a sample showcase how to do lookup query, instead using mongodb/mongoose
 * lookup method, we can simply write a find method with extra arguments, the previous
 * query result is stored as context which we can retrieved and assign as parameters
 * for the next lookup 
 */
const countries = [
  {
    country_code: 'US',
    country_name: 'USA',
    population: 331000000
  },
  {
    country_code: 'CA',
    country_name: 'Canada',
    population: 38000000
  }
]

const cities = [
  {
    city_name: 'Washington D.C.',
    country_code: 'US',
    population: 700000
  },
  {
    city_name: 'Ottawa',
    country_code: 'CA',
    population: 1000000
  }
]

const data = [countries, cities]

const modelOptions = [{
  name: 'Country',
  fields: {
    country_name: { type: String, unique: true },
    country_code: String,
    population: Number
  }
}, {
  name: 'City',
  fields: {
    city_name: { type: String, unique: true },
    country_code: String,
    population: Number
  }
}]

const fields = (model) => Object.entries(model.fields).map(([key]) => ({ [key]: 1 })).reduce((a, b) => ({ ...a, ...b }))

async function save (model, data) {
  return Promise.all(data.map(async d => {
    const query = await requrseMongoose({
      [model.name]: {
        create: {
          $params: {
            data: d
          },
          ...fields(model)
        }
      }
    }, model)
    return query
  }))
}

let index = 0
for (const model of modelOptions) {
  await save(model, data[index])
  index++
}

async function lookup (query) {
  const queryResult = await requrseMongoose({
    Country: {
      find: {
        $params: {
          query
        },
        country_name: 1,
        population: 1,
        lookup: { // generic method that don't exist as entry of the previous query
          $params: {
            name: 'City',
            country_code: 1
          },
          city_name: 1,
          population: 1
        }
      }
    }
  })

  return queryResult
}

await lookup({ country_code: 'US' }).then(result => {
  test(result, {
    Country: {
      find: {
        country_name: 'USA',
        population: 331000000,
        lookup:{
          city_name: 'Washington D.C.',
          population: 700000
        }
      }
    }
  }, 'Should return result with lookup table')
}, console.error)

await lookup({ country_code: 'CA' }).then(result => {
  test(result, {
    Country: {
      find: {
        country_name: 'Canada',
        population: 38000000,
        lookup: {
            city_name: 'Ottawa',
            population: 1000000
        }
      }
    }
  }, 'Should return result with lookup table')
}, console.error)

async function deleteModel (model) {
  const queryResult = await requrseMongoose({
    [model.name]: {
      delete: {
        acknowledged: 1, 
        deletedCount: 1
      }
    }
  })

  return queryResult
}

for (const model of modelOptions) {
  await deleteModel(model)
}

mongoose.disconnect()
