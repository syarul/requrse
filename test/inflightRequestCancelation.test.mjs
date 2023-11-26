import axios from 'axios'
import assert from 'assert'
import rq from '../libs/executor.cjs'
import util from 'util'

const log = (d) => console.log(util.inspect(d, false, 9, true))

const { CancelToken } = axios

// Create a cancel token source
const cancelSource = CancelToken.source()

rq({
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
      }
    }
  }
},
{
  methods: {
    request: 'request'
  },
  config: (param) => ({
    request: (url) => axios.get(url, {
      cancelToken: cancelSource.token // Assign the cancel token to the request
    })
  })[param]
}).then(log, (error) => {
  assert.equal(error.message, 'Request canceled by user.')
})

// Simulate cancellation after 10ms
setTimeout(() => {
  cancelSource.cancel('Request canceled by user.') // Cancel the request
}, 10)
