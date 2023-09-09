import axios from 'axios'
import assert from 'assert'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const queryExec = require('../libs/executor')

const log = (d) => console.log(require('util').inspect(d, false, 9, true))

const { CancelToken } = axios

// Create a cancel token source
const cancelSource = CancelToken.source()

queryExec({
  Test: {
    test: {
      request: {
        $params: {
          url: 'https://api.github.com/users/douglascrockford'
        },
        status: 1,
        data: {
          id: 1,
          login: 1
        }
      },
    }
  }
},
{
  methods: {
    request: 'request'
  },
  config: (param) => {
    return ({
      request: (url) => { 
        return axios.get(url, {
          cancelToken: cancelSource.token // Assign the cancel token to the request
        })
      }
    })[param]
  }
}).then(log, (error) => {
  assert.equal(error.message, 'Request canceled by user.')
})

// // Simulate cancellation after 10ms
setTimeout(() => {
  cancelSource.cancel('Request canceled by user.') // Cancel the request
}, 10)
