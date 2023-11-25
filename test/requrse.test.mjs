import assert from 'assert'
import rq from '../libs/executor.cjs'
import fs from 'fs'

const file = './test/data.json'

fs.writeFileSync(file, JSON.stringify({
  author: {
    name: 'J.K. Rowling',
    country: 'United Kingdom'
  }
}))

const config = (param) => ({
  foo: () => 5,
  bar: 2,
  ber: 1,
  person: {
    name: 'John',
    age: 15
  },
  occupation: {
    job: 'Copywriter',
    company: 'New York Post'
  },
  recurrentPerson: 'person',
  data: () => JSON.parse(fs.readFileSync('./test/data.json')),
  updateData (current, next, $params) {
    let newData = $params.map(key =>
      ({ ...current[key], ...next[key] })
    ).reduce((acc, curr) => ({ ...acc, ...curr }), {})
    newData = Object.fromEntries($params.map(p => [p, newData]))
    fs.writeFileSync(file, JSON.stringify(newData))
    return newData
  },
  addedAge: (current, $params) => {
    $params.forEach(key => {
      if (current[key]) {
        current[key]++
      }
    })
    return current
  }
})[param] || null

const methods = {
  hello () {
    return [{ a: 'x' }]
  },
  foo: 'foo',
  bar: 'bar',
  ber: 'ber',
  person: 'person',
  recurrentPerson: 'recurrentPerson',
  data: 'data',
  updateData: 'updateData,author',
  occupation: 'occupation',
  addedAge: 'addedAge,age'
}

await rq({
  Test: {
    test: {
      hello: {
        a: 1
      }
    }
  }
}, { methods, config }).then((result) => {
  assert.deepEqual(result, {
    Test: {
      test: {
        hello: { a: 'x' }
      }
    }
  })
}, console.error)

await rq({
  Test: {
    test: {
      foo: 1
    }
  }
}, { methods, config }).then((result) => {
  assert.deepEqual(result, {
    Test: {
      test: {
        foo: 5
      }
    }
  })
}, console.error)

await rq({
  Test: {
    test: {
      bar: 1
    }
  }
}, { methods, config }).then((result) => {
  assert.deepEqual(result, {
    Test: {
      test: {
        bar: 2
      }
    }
  })
}, console.error)

await rq({
  Test: {
    test: {
      ber: 1
    }
  }
}, { methods, config }).then((result) => {
  assert.deepEqual(result, {
    Test: {
      test: {
        ber: 1
      }
    }
  })
}, console.error)

// // test deep query
await rq({
  Test: {
    test: {
      person: {
        name: 1,
        occupation: {
          job: 1
        }
      }
    }
  }
}, { methods, config }).then((result) => {
  assert.deepEqual(result, {
    Test: {
      test: {
        person: {
          name: 'John',
          occupation: {
            job: 'Copywriter'
          }
        }
      }
    }
  })
}, console.error)

// // test non-scalar query
await rq({
  Test: {
    test: {
      person: '*'
    }
  }
}, { methods, config }).then((result) => {
  assert.deepEqual(result, {
    Test: {
      test: {
        person: {
          name: 'John',
          age: 15
        }
      }
    }
  })
}, console.error)

// test recurrence query
await rq({
  Test: {
    test: {
      recurrentPerson: '*'
    }
  }
}, { methods, config }).then((result) => {
  assert.deepEqual(result, {
    Test: {
      test: {
        recurrentPerson: {
          name: 'John',
          age: 15
        }
      }
    }
  })
}, console.error)

// test data immutable method
await rq({
  Test: {
    test: {
      data: '*',
      updateData: {
        $params: {
          author: {
            books: [
              'Harry Potter and the Philosopher\'s Stone',
              'Harry Potter and the Chamber of Secrets'
            ]
          }
        },
        author: 1
      }
    }
  }
}, { methods, config }).then((result) => {
  assert.deepEqual(result, {
    Test: {
      test: {
        data: {
          author: {
            name: 'J.K. Rowling',
            country: 'United Kingdom'
          }
        },
        updateData: {
          author: {
            name: 'J.K. Rowling',
            country: 'United Kingdom',
            books: [
              'Harry Potter and the Philosopher\'s Stone',
              'Harry Potter and the Chamber of Secrets'
            ]
          }
        }
      }
    }
  })
}, console.error)

// test data immutable method
await rq({
  Test: {
    test: {
      person: {
        age: 1,
        addedAge: {
          age: 1
        }
      }
    }
  }
}, { methods, config }).then((result) => {
  assert.deepEqual(result, {
    Test: {
      test: {
        person: {
          age: 15,
          addedAge: {
            age: 16
          }
        }
      }
    }
  })
}, console.error)
