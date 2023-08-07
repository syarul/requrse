const assert = require('assert')
const Redis = require('ioredis')
require('dotenv').config()

const requrseRedis = require('./redis.middleware')

const redis = new Redis(`rediss://default:${process.env.REDIS_KEY}@mutual-sponge-37619.upstash.io:37619`)

const redisKey = 'books'
const memberKey = 'books_ids'

const modelOptions = {
  redis, redisKey, memberKey
}

const books = [{
  title: 'Harry Potter and the Sorcerer\'s Stone',
  genre: 'Fantasy'
}, {
  title: 'Foundation',
  genre: 'Science Fiction'
}]

async function save (data) {
  const books = await requrseRedis({
    book: {
      create: {
        $params: {
          data,
          title: 1 // this will be used as secondary key
        },
        title: 1
      }
    }
  }, modelOptions)

  return books
}

async function find () {
  const books = await requrseRedis({
    book: {
      find: {
        $params: {
          query: { title: 'Foundation' }
        },
        genre: 1
      }
    }
  }, modelOptions)

  return books
}

async function update (id, data) {
  const books = await requrseRedis({
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
  const books = await requrseRedis({
    book: {
      remove: {
        $params: { id },
        id: 1
      }
    }
  }, modelOptions)

  return books
}

async function test () {
  for (const book of books) {
    await save(book).then(console.log, console.error)
  }

  await find()
    .then(result => {
      assert.deepEqual(result, { book: { find: { genre: 'Science Fiction' } } })
    }, console.error)

  let keys

  await requrseRedis({
    book: {
      getMemberKeys: {
        keys: 1
      }
    }
  }, modelOptions).then(result => {
    keys = result.book.getMemberKeys.keys
  }, console.error)

  await update(keys[0], {
    title: 'Harry Potter and the Prisoner of Azkaban'
  }).then(console.log, console.error)

  await requrseRedis({
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

  for (const key of keys) {
    await remove(key).then(console.log, console.error)
  }

  await find()
    .then(result => {
      console.log(result)
      assert.deepEqual(result, {
        book: {
          find: {
            genre: 1
          }
        }
      })
    }, console.error)
}

test().then(() => {
  redis.disconnect()
})
