import assert from 'assert'
import rq from '../libs/executor.cjs'
import { test } from './fixture/test.mjs'

await test('Hello world', () => {
  rq({
    Test: {
      test: {
        greeting: '*'
      }
    }
  },
  {
    methods: {
      greeting () {
        return 'hello world'
      }
    }
  }).then((result) => {
    assert.deepEqual(result, { Test: { test: { greeting: 'hello world' } } })
  })
})

await test('Hello world greeting', () => {
  rq({
    test: {
      greeting: 1
    }
  },
  {
    methods: {
      test () {
        return {
          test: {
            greeting: 'hello world'
          }
        }
      }
    }
  }).then((result) => {
    assert.deepEqual(result, { test: { greeting: 'hello world' } })
  })
})

await test('Hello world null', () => {
  rq({
    test: {
      greeting: 1
    }
  },
  {
    methods: {
      test () {
        return {
          test: {
            greeting: null
          }
        }
      }
    }
  }).then((result) => {
    assert.deepEqual(result, { test: { greeting: null } })
  })
})

await test('Hello array of array', () => {
  rq({
    test: {
      greeting: '*'
    }
  },
  {
    methods: {
      test () {
        return [[0], [1], [2]]
      },
      greeting () {
        return 'hello'
      }
    }
  }).then((result) => {
    assert.deepEqual(result, {
      test: [
        { greeting: ['hello'] },
        { greeting: ['hello'] },
        { greeting: ['hello'] }
      ]
    })
  })
})

await test('Resolve promise', () => {
  rq({
    Test: {
      test: {
        person: {
          name: 1
        }
      }
    }
  },
  {
    methods: {
      person () {
        return Promise.resolve({ name: 'Foo', age: 12 })
      }
    }
  }).then((result) => {
    assert.deepEqual(result, {
      Test: { test: { person: { name: 'Foo' } } }
    })
  })
})

await test('$params', () => {
  rq({
    Test: {
      test: {
        person: {
          $params: { name: 'Bar', age: 30 },
          name: 1,
          age: 1
        }
      }
    }
  },
  {
    methods: {
      person (name, age) {
        return { name, age }
      }
    }
  }).then((result) => {
    assert.deepEqual(result, {
      Test: { test: { person: { name: 'Bar', age: 30 } } }
    })
  })
})

await test('Use config', () => {
  rq({
    Test: {
      test: {
        person: {
          $params: { age: 30 },
          name: 1,
          age: 1
        }
      }
    }
  },
  {
    methods: {
      person: 'getPerson'
    },
    config: (param) => ({
      getPerson (age) {
        return { name: 'Foo', age }
      }
    })[param]
  }).then((result) => {
    assert.deepEqual(result, {
      Test: { test: { person: { name: 'Foo', age: 30 } } }
    })
  })
})

await test('Custom parameter <type>', () => {
  rq({
    Test: {
      test: {
        occupation: 1,
        person: {
          $params: { age: 30 },
          name: 1,
          age: 1,
          occupation: 1
        }
      }
    }
  },
  {
    methods: {
      occupation () {
        return { type: 'Copywriter', started: '2020', city: 'NY' }
      },
      person: 'getPerson,type'
    },
    config: (param) => ({
      getPerson (occupation, { age }, [$param]) {
        return {
          name: 'Foo',
          age,
          occupation: {
            [$param]: occupation[$param]
          }
        }
      }
    })[param]
  }).then((result) => {
    assert.deepEqual(result, {
      Test: {
        test: {
          occupation: 1,
          person: { name: 'Foo', age: 30, occupation: { type: 'Copywriter' } }
        }
      }
    })
  })
})

await test('Object tree', () => {
  rq({
    Test: {
      test: {
        person: {
          $params: { name: 'Foo' },
          name: 1,
          age: 1,
          birth: {
            year: 1,
            area: {
              city: 1
            }
          },
          occupation: {
            type: 1
          }
        }
      }
    }
  },
  {
    methods: {
      area: 'area',
      occupation: 'occupation',
      person: 'getPerson',
      birth: 'birth'
    },
    config: (param) => ({
      area () {
        return { city: 'NY' }
      },
      occupation () {
        return { type: 'CT0' }
      },
      birth () {
        return { year: '1981' }
      },
      getPerson (name) {
        return { name, age: 42 }
      }
    })[param]
  }).then((result) => {
    assert.deepEqual(result, {
      Test: {
        test: {
          person: {
            name: 'Foo',
            age: 42,
            birth: { year: '1981', area: { city: 'NY' } },
            occupation: { type: 'CT0' }
          }
        }
      }
    })
  })
})
