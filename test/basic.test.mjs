import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const queryExec = require('../libs/executor')

const log = (d) => console.log(require('util').inspect(d, false, 9, true))

await queryExec({
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
}).then(log, console.error)

await queryExec({
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
}).then(log, console.error)

await queryExec({
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
}).then(log, console.error)

await queryExec({
  Test: {
    test: {
      person: {
        $params: { age: 30 },
        name: 1,
        age:1
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
}).then(log, console.error)

await queryExec({
  Test: {
    test: {
      occupation: 1,
      person: {
        $params: { age: 30 },
        name: 1,
        age:1,
        occupation: 1
      }
    }
  }
},
{
  methods: {
    occupation(){
      return { type: 'Copywriter', started: '2020', city: 'NY' }
    },
    person: 'getPerson,type'
  },
  config: (param) => ({
    getPerson (occupation, { age }, [ $param ]) {
      return { 
        name: 'Foo', 
        age, 
        occupation: {
          [$param]: occupation[$param]
        }
      }
    }
  })[param]
}).then(log, console.error)

await queryExec({
  Test: {
    test: {
      person: {
        $params: { name: 'Foo' },
        name: 1,
        age:1,
        birth: {
          year: 1,
          area: {
            city: 1
          }
        },
        occupation: {
          type: 1,
        },
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
    area() {
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
}).then(log, console.error)
