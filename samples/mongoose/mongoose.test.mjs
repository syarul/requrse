import assert from 'assert'
import mongoose from 'mongoose'
import requrseMongoose from './mongoose.middleware.mjs'

mongoose.Promise = global.Promise

mongoose
  .connect('mongodb://localhost:27017/requrse')
  .catch(error => {
    console.log(error)
    process.exit(1)
  })

let arg
const test = async function(msg, run) {
  console.log(`\r\n :: ${msg} ::\r\n`)
  try {
    arg = await run(arg)
  } catch (e) {
    console.error(e)
  }
}

const modelOptions = {
  name: 'Book',
  fields: {
    title: { type: String, unique: true },
    genre: String
  }
}

await test ('Should give us undisputable result of a book with title: Harry Potter and the Sorcerer\'s Stone', async function() {
  const query = {
    Book: {
      create: {
        $params: {
          data: {
            title: 'Harry Potter and the Sorcerer\'s Stone',
            genre: 'Fantasy'
          }
        },
        title: 1
      }
    }
  }
  const result = await requrseMongoose(query, modelOptions)
  assert.deepEqual(result, {
    Book: {
      create: {
        title: "Harry Potter and the Sorcerer's Stone"
      }
    }
  })
})

await test ( 'Should give us undisputable result of a new book with title: Harry Potter and the Prisoner of Azkaban', async function() {
  const query = {
    Book: {
      find: {
        _id: 1
      }
    }
  }
  const { Book: { find: { _id } } } = await requrseMongoose(query)
  const updateQuery = {
    Book: {
      update: {
        $params: { 
          id: _id,
          data: {
            title: 'Harry Potter and the Prisoner of Azkaban'
          }
        },
        title: 1
      }
    }
  }
  await requrseMongoose(updateQuery)
  const findQuery = {
    Book: {
      find: {
        title: 1
      }
    }
  }
  const result = await requrseMongoose(findQuery)
  assert.deepEqual(result, {
    Book: {
      find: {
        title: 'Harry Potter and the Prisoner of Azkaban'
      }
    }
  })
  return _id
})

await test ('Should give us empty result after removal operation of the book', async function (id) {
  const removeQuery = {
    Book: {
      remove: {
        $params: {
          id
        }
      }
    }
  }
  await requrseMongoose(removeQuery)
  const findQuery = {
    Book: {
      find: {
        title: 1
      }
    }
  }
  const result = await requrseMongoose(findQuery)
  assert.deepEqual(result, {
    Book: {
      find: []
    }
  })
})

mongoose.disconnect()