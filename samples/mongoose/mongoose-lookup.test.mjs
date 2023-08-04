import assert from 'assert'
import mongoose from 'mongoose'

import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const log = (d) => console.log(require('util').inspect(d, false, 9, true))

const requrseMongoose = require('./mongoose')

mongoose.Promise = global.Promise

mongoose
  .connect('mongodb://localhost:27017/requrse')
  .catch(error => {
    console.log(error)
    process.exit(1)
  })

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

async function lookup (model, query, lookupModel) {
  const queryResult = await requrseMongoose({
    [model.name]: {
      find: {
        $params: {
          query
        },
        ...{
          ...fields(model),
          lookup: {
            $params: {
              model: lookupModel,
              country_code: 1
            },
            ...fields(lookupModel)
          }
        }
      }
    }
  }, model)

  return queryResult
}

await lookup(modelOptions[0], { country_code: 'US' }, modelOptions[1]).then(result => {
  log(result)
  assert.deepEqual(result, {
    Country: {
      find: {
        country_name: 'USA',
        country_code: 'US',
        population: 331000000,
        lookup: [
          {
            city_name: 'Washington D.C.',
            country_code: 'US',
            population: 700000
          }
        ]
      }
    }
  })
}, console.error)

await lookup(modelOptions[0], { country_code: 'CA' }, modelOptions[1]).then(result => {
  log(result)
  assert.deepEqual(result, {
    Country: {
      find: {
        country_name: 'Canada',
        country_code: 'CA',
        population: 38000000,
        lookup: [
          {
            city_name: 'Ottawa',
            country_code: 'CA',
            population: 1000000
          }
        ]
      }
    }
  })
}, console.error)

async function deleteModel (modelOptions) {
  const queryResult = await requrseMongoose({
    [modelOptions.name]: {
      delete: {
        acknowledged: 1, 
        deletedCount: 1
      }
    }
  }, modelOptions)

  return queryResult
}

for (const model of modelOptions) {
  await deleteModel(model).then(log, console.error)
}

mongoose.disconnect()
