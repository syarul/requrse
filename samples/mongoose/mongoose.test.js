const assert = require('assert')
const mongoose = require('mongoose')
mongoose.Promise = global.Promise

mongoose
  .connect('mongodb://localhost:27017/requrse', {
    connectTimeoutMS: 1000,
    serverSelectionTimeoutMS: 1000
  })
  .catch(error => {
    console.log(error)
    process.exit(1)
  })

const requrseMongoose = require('./mongoose')

const test = (result, expected, msg = '') => {
  try {
    assert.deepEqual(result, expected)
    console.log(`\r\n:: ${msg} ::\r\n`)
  } catch(e) {
    console.log(`\r\n:: Test failed: ${msg} ::`)
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

async function save () {
  const books = await requrseMongoose({
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
  }, modelOptions)

  return books
}

async function find () {
  const books = await requrseMongoose({
    Book: {
      find: {
        $params: {
          query: { genre: 'Fantasy' }
        },
        _id: 1
      }
    }
  })

  return books
}

async function update (id, data) {
  const books = await requrseMongoose({
    Book: {
      update: {
        $params: { id, data },
        title: 1
      }
    }
  })

  return books
}

async function remove (id) {
  const books = await requrseMongoose({
    Book: {
      remove: {
        $params: { id },
        _id: 1
      }
    }
  })

  return books
}

async function exec () {
  await save()
    .then(result => {
      test(result, {
        Book: {
          create: {
            title: "Harry Potter and the Sorcerer's Stone"
          }
        }
      }, 'Should return result after save')
    }, console.error)

  let id

  await find()
    .then(result => {
      id = result.Book.find._id
      return result
    })

  await update(id, {
    title: 'Harry Potter and the Prisoner of Azkaban'
  })

  await requrseMongoose({
    Book: {
      find: {
        $params: {
          query: { genre: 'Fantasy' }
        },
        title: 1
      }
    }
  }).then(result => {
    test(result, {
      Book: {
        find: {
          title: 'Harry Potter and the Prisoner of Azkaban'
        }
      }
    }, 'Should return correct result after update')
  }, console.error)

  await remove(id)

  await find()
    .then(result => {
      test(result, {
        Book: {
          find: []
        }
      }, 'Should show empty result after removal')
    }, console.error)
}

exec().then(() => {
  mongoose.disconnect()
})
