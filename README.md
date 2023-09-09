# reQurse
Lightweight driven query language

[![NPM Version](https://img.shields.io/npm/v/requrse.svg)](https://www.npmjs.com/package/requrse)
[![requrse CI](https://github.com/syarul/requrse/actions/workflows/main-ci.yml/badge.svg)](https://github.com/syarul/requrse/actions/workflows/main-ci.yml)

## What is reQurse
**reQurse** introduces an innovative approach that overcomes the complexities of CRUD operations. The focus is on delivering a streamlined and efficient CRUD library solution, simplifying API development, and effortlessly handling complex data management tasks. **reQurse** utilized JSON-based queries enables you to load data from external configuration files as your numbers of APIs grow, reducing code dependencies and mitigating the need to write lengthy procedural APIs. This approach promotes a modular and streamlined code structure, enhancing flexibility and maintainability.

> This library take some inspirations from NextQL and GraphQL

## Getting Start
For a quick start you can check [samples](https://github.com/syarul/requrse/blob/main/samples) folder to see usage cases with [Mongoose](https://github.com/syarul/requrse/blob/main/samples/mongoose), [Redis](https://github.com/syarul/requrse/blob/main/samples/redis) and the [Starwars](https://github.com/syarul/requrse/blob/main/samples/starwars) examples.

A basic usage of reQurse.
```javascript
import queryExec from 'requrse'

queryExec(query, { methods, config })
```
- **query**: *(object)* ***required*** JSON like query.
- **methods**: *(object)* ***required*** define methods/computed fields that exist in the query.
- **config**: *(object)* ***optional*** extend and added parameterize control over methods.
```js
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

## Sample usage with lookup table and model caching

Using **reQurse** for lookup queries offers greater flexibility and memory efficiency compared to the standard database lookup method. With reQurse, you can avoid resource exhaustion issues like timeouts, especially when dealing with complex data structures and custom projections. To see an implementation example, check out the [Mongoose Lookup](https://github.com/syarul/requrse/blob/main/samples/mongoose/mongoose-lookup.test.mjs) sample.

Additionally, **reQurse** provides support for model caching, eliminating the need to repeatedly declare the model for each query. This caching feature streamlines your querying process. For a practical use case, refer to the [Mongoose Middleware](https://github.com/syarul/requrse/blob/main/samples/mongoose/mongoose.middleware.js) query for usage case.

> P/S: If your Entity-Relationship Diagram (ERD) is massive and you anticipate having more, it's better to convert your queries into JSON format and store them elsewhere, for example, in a Redis database or AWS DynamoDB.