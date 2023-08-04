const assert = require('assert')
const mongoose = require('mongoose')
mongoose.Promise = global.Promise

mongoose
  .connect('mongodb://localhost:27017/requrse')
  .catch(error => {
    console.log(error)
    process.exit(1)
  })

const requrseMongoose = require('./mongoose')

const modelOptions = {
  name: 'Book',
  fields: {
    title: { type: String, unique: true },
    genre: String
  }
}

async function save () {
  const books = await requrseMongoose({
    book: {
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
    book: {
      find: {
        $params: {
          query: { genre: 'Fantasy' }
        },
        _id: 1
      }
    }
  }, modelOptions)

  return books
}

async function update (id, data) {
  const books = await requrseMongoose({
    book: {
      update: {
        $params: { id, data },
        title: 1
      }
    }
  }, modelOptions)

  return books
}

async function remove (id) {
  const books = await requrseMongoose({
    book: {
      remove: {
        $params: { id },
        _id: 1
      }
    }
  }, modelOptions)

  return books
}

async function test () {
  await save()
    .then(result => {
      console.log(result)
      assert.deepEqual(result, {
        book: {
          create: {
            title: "Harry Potter and the Sorcerer's Stone"
          }
        }
      })
    }, console.error)

  let id

  await find()
    .then(result => {
      id = result.book.find._id
      return result
    })
    .then(console.log, console.error)

  await update(id, {
    title: 'Harry Potter and the Prisoner of Azkaban'
  }).then(console.log, console.error)

  await requrseMongoose({
    book: {
      find: {
        $params: {
          query: { genre: 'Fantasy' }
        },
        title: 1
      }
    }
  }, modelOptions).then(result => {
    console.log(result)
    assert.deepEqual(result, {
      book: {
        find: {
          title: 'Harry Potter and the Prisoner of Azkaban'
        }
      }
    })
  }, console.error)

  await remove(id).then(console.log, console.error)

  await find()
    .then(result => {
      console.log(result)
      assert.deepEqual(result, {
        book: {
          find: []
        }
      })
    }, console.error)
}

test().then(() => {
  mongoose.disconnect()
})
