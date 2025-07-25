import assert from 'assert'
import Redis from 'ioredis'
import dotenv from 'dotenv'
import requrseRedis from './redis.middleware.mjs'
import { test } from '../../test/fixture/test.mjs'

dotenv.config()

const redis = new Redis(`redis://default:${process.env.REDIS_KEY}@${process.env.REDIS_URL}`)
// const redis = new Redis(`redis://127.0.0.1:6379`)


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

await test('Save book', async () => {
  for (const book of books) {
    await save(book).then(result => {
      assert.deepEqual(result, {
        book: { create: { title: book.title } }
      })
    }, console.error)
  }
})

await test('Find book', () =>
  find()
    .then(result => {
      assert.deepEqual(result, { book: { find: { genre: 'Science Fiction' } } })
    }, console.error)
)

let keys

await test('Retrieve member keys', () =>
  requrseRedis({
    book: {
      getMemberKeys: {
        keys: 1
      }
    }
  }, modelOptions).then(result => {
    keys = result.book.getMemberKeys.keys
    assert.deepEqual(result, { book: { getMemberKeys: { keys: ['0', '1'] } } })
  }, console.error)
)

await test('Update book title', () =>
  update(keys[0], {
    title: 'Harry Potter and the Prisoner of Azkaban'
  }).then(result => {
    assert.deepEqual(result, {
      book: { update: { title: 'Harry Potter and the Prisoner of Azkaban' } }
    })
  }, console.error)
)

await test('Find book by genre', () =>
  requrseRedis({
    book: {
      find: {
        $params: {
          query: { genre: 'Fantasy' }
        },
        title: 1
      }
    }
  }, modelOptions).then(result => {
    assert.deepEqual(result, {
      book: {
        find: {
          title: 'Harry Potter and the Prisoner of Azkaban'
        }
      }
    })
  }, console.error)
)

await test('Remove keys, secondary keys', async () => {
  for (const key of keys) {
    await remove(key).then(result => {
      assert.deepEqual(result, { book: { remove: { id: 1 } } })
    }, console.error)
  }
})

await test('Confirm no more records exist', () =>
  find()
    .then(result => {
      assert.deepEqual(result, {
        book: {
          find: {
            genre: 1
          }
        }
      })
    }, console.error)
)

redis.disconnect()
