# reQurse
Lightweight driven query language

[![NPM Version](https://img.shields.io/npm/v/requrse.svg)](https://www.npmjs.com/package/requrse)
[![requrse CI](https://github.com/syarul/requrse/actions/workflows/main-ci.yml/badge.svg)](https://github.com/syarul/requrse/actions/workflows/main-ci.yml)

## What is reQurse
In hindsight, many query language or API-driven solutions tend to be burdened by cumbersome paradigms, abstraction complexity, bloated safe type checking, and steep learning curves. However, **reQurse** sets out to address these challenges to a significant extent. This effort is driven by Decision Science, providing the fundamental approach to overcome the complexities associated with CRUD operations. With reQurse, the aim is to offer a streamlined and efficient CRUD library solution that simplifies api development and tackle complex data management tasks with ease.

> This library take some inspirations from NextQL and GraphQL

## Getting Start
For a quick start you can check [samples](https://github.com/syarul/requrse/blob/main/samples) folder to see usage cases with [Mongoose](https://github.com/syarul/requrse/blob/main/samples/mongoose), [Redis](https://github.com/syarul/requrse/blob/main/samples/redis) and the [Starwars](https://github.com/syarul/requrse/blob/main/samples/starwars) examples.

A basic usage of reQurse, you do not need to define model and all sorts of abstractions to fulfil the usage case.
```js
import queryExec from 'requrse'

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
}).then(console.log, console.error)
// { Test: { test: { greeting: 'hello world' } } }
```

By default methods will automatically resolve promises.
```js
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
}).then(console.log, console.error)
// { Test: { test: { person: { name: 'Foo' } } } }
```

You can pass arguments using `$params` parameter.
```js
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
}).then(console.log, console.error)
// { Test: { test: { person: { name: 'Bar', age: 30 } } } }
```

You can add options `config` to map methods with different name. This allow a consistent structure of the query.
```js
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
}).then(console.log, console.error)
// { Test: { test: { person: { name: 'Foo', age: 30 } } } }
```

With `config` you can specify custom parameter to map result or use it as input for your methods.
```js
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
    // 'type' is custom key where methods have access to them as arguments, you can add multiple keys with '|'
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
}).then(console.log, console.error)
// {
//   Test: {
//     test: {
//       occupation: 1,
//       person: { name: 'Foo', age: 30, occupation: { type: 'Copywriter' } }
//     }
//   }
// }
```

The query tree is resolve recursively, so you can have very complex query structure.
```js
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
}).then(console.log, console.error)
// {
//   Test: {
//     test: {
//       person: {
//         name: 'Foo',
//         age: 42,
//         birth: { year: '1981', area: { city: 'NY' } },
//         occupation: { type: 'CT0' }
//       }
//     }
//   }
// }
```