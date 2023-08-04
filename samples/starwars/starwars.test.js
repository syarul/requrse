const assert = require('assert')
const onqlExecute = require('./starwars')

const testList = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10
]

const test = (num, msg, run) => {
  if (testList.includes(num)) {
    console.log(`\r\n :: ${msg} ::\r\n`)
    Promise.resolve(run())
  }
}

test(0, 'Correctly identifies R2-D2 as the hero of the Star Wars Saga', async () => {
  const query = {
    character: {
      hero: {
        name: 1
      }
    }
  }
  const result = await onqlExecute(query)
  assert.deepEqual(result, {
    character: {
      hero: {
        name: 'R2-D2'
      }
    }
  })
})

test(1, 'Correctly identifies Luke as the hero of the Star Wars Saga', async () => {
  const query = {
    character: {
      hero: {
        $params: { episode: 5 },
        name: 1
      }
    }
  }
  const result = await onqlExecute(query)
  assert.deepEqual(result, {
    character: {
      hero: {
        name: 'Luke Skywalker'
      }
    }
  })
})

test(2, 'Correctly identifies C-3PO using ID', async () => {
  const query = {
    character: {
      droid: {
        $params: { id: 2000 },
        name: 1
      }
    }
  }
  const result = await onqlExecute(query)
  assert.deepEqual(result, {
    character: {
      droid: {
        name: 'C-3PO'
      }
    }
  })
})

test(3, 'Allows us to query for the ID and friends of R2-D2', async () => {
  const query = {
    character: {
      hero: {
        id: 1,
        name: 1,
        friends: {
          name: 1
        }
      }
    }
  }
  const result = await onqlExecute(query)
  assert.deepEqual(result, {
    character: {
      hero: {
        id: '2001',
        name: 'R2-D2',
        friends: [
          {
            name: 'Luke Skywalker'
          },
          {
            name: 'Han Solo'
          },
          {
            name: 'Leia Organa'
          }
        ]
      }
    }
  })
})

test(4, 'Allows us to query for the friends of friends of R2-D2', async () => {
  const query = {
    character: {
      hero: {
        name: 1,
        friends: {
          name: 1,
          appearsIn: 1,
          friends: {
            name: 1
          }
        }
      }
    }
  }
  const result = await onqlExecute(query)
  assert.deepEqual(result, {
    character: {
      hero: {
        name: 'R2-D2',
        friends: [
          {
            name: 'Luke Skywalker',
            appearsIn: [4, 5, 6],
            friends: [
              {
                name: 'Han Solo'
              },
              {
                name: 'Leia Organa'
              },
              {
                name: 'C-3PO'
              },
              {
                name: 'R2-D2'
              }
            ]
          },
          {
            name: 'Han Solo',
            appearsIn: [4, 5, 6],
            friends: [
              {
                name: 'Luke Skywalker'
              },
              {
                name: 'Leia Organa'
              },
              {
                name: 'R2-D2'
              }
            ]
          },
          {
            name: 'Leia Organa',
            appearsIn: [4, 5, 6],
            friends: [
              {
                name: 'Luke Skywalker'
              },
              {
                name: 'Han Solo'
              },
              {
                name: 'C-3PO'
              },
              {
                name: 'R2-D2'
              }
            ]
          }
        ]
      }
    }
  })
})

test(5, 'Allows us to query for Luke Skywalker directly, using his ID', async () => {
  const query = {
    human: {
      human: {
        $params: { id: '1000' },
        name: 1
      }
    }
  }
  const result = await onqlExecute(query)
  assert.deepEqual(result, {
    human: {
      human: {
        name: 'Luke Skywalker'
      }
    }
  })
})

test(6, 'Allows us to create a generic query, then pass an invalid ID to get null back', async () => {
  const query = {
    human: {
      human: {
        $params: { id: 'not valid id' },
        name: 1
      }
    }
  }
  const result = await onqlExecute(query)
  assert.deepEqual(result, {
    human: {
      human: null
    }
  })
})

test(7, 'Allows us to query for Luke, changing his key with an alias', async () => {
  const query = {
    human: {
      'human/luke': {
        $params: { id: '1000' },
        name: 1
      }
    }
  }
  const result = await onqlExecute(query)
  assert.deepEqual(result, {
    human: {
      'human/luke': {
        name: 'Luke Skywalker'
      }
    }
  })
})

test(8, 'Allows us to query for both Luke and Leia, using two root fields and an alias', async () => {
  const query = {
    human: {
      'human/luke': {
        $params: { id: '1000' },
        name: 1
      },
      'human/leia': {
        $params: { id: '1003' },
        name: 1
      }
    }
  }

  const result = await onqlExecute(query)
  assert.deepEqual(result, {
    human: {
      'human/luke': {
        name: 'Luke Skywalker'
      },
      'human/leia': {
        name: 'Leia Organa'
      }
    }
  })
})

test(9, 'Allows us to query using duplicated content', async () => {
  const query = {
    human: {
      'human/luke': {
        $params: { id: '1000' },
        name: 1,
        homePlanet: 1
      },
      'human/leia': {
        $params: { id: '1003' },
        name: 1,
        homePlanet: 1
      }
    }
  }

  const result = await onqlExecute(query)
  assert.deepEqual(result, {
    human: {
      'human/luke': {
        name: 'Luke Skywalker',
        homePlanet: 'Tatooine'
      },
      'human/leia': {
        name: 'Leia Organa',
        homePlanet: 'Alderaan'
      }
    }
  })
})

test(10, 'Fail fast on accessing secretBackstory', async () => {
  const query = {
    character: {
      hero: {
        name: 1,
        secretBackstory: 1
      }
    }
  }

  await onqlExecute(query)
    .catch(error => {
      assert.equal(error.message, 'secretBackstory is secret.')
    })
})
