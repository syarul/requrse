const queryExec = require('../../libs/executor')
const mongoose = require('mongoose')

const Model = {}

module.exports = (query, opts) => queryExec(query, {
  methods: {
    get: 'get,id',
    find: 'find,query',
    create: 'create,data',
    update: 'update,id|data', // split parameters options
    remove: 'remove,id',
    lookup: 'lookup',
    delete: 'delete'
  },
  config: (param) => {
    function model (options) {
      const { name, fields } = options || opts || {}
      if (name && fields && !mongoose.models[name]) {
        // cache model
        Model[name] = opts
        return mongoose.model(name, fields)
      } else if (mongoose.models[name]){
        return mongoose.models[name]
        // model cache retrieval
      } else if (Model[this.key]) {
        return model.call(null, Model[this.key])
      } else {
        throw new Error('No such model exist')
      }
    }

    const mongooseMethods = {
      get ({ id }) {
        return model.findById(id)
      },
      find ({ query }) {
        return model.call(this).find(query)
      },
      create ({ data }) {
        const m = model()
        const ins = new m(data)
        return ins.save()
      },
      update ({ id }, { data }) {
        return model.call(this).findByIdAndUpdate(id, data)
      },
      remove ({ id }) {
        return model.call(this).findByIdAndRemove(id)
      },
      lookup ({ name, ...params }) {
        // you can alternatively access query result from context 'this',
        // by default result is return as the 1st argument by previous keys/entries that 
        // exist in the query i.e. (in this usage case) country,country_code or population
        // as the method name. The starwars example showcase this through the 'character.friends'
        // under 'friends' method naming. Since we using a generic name call 'lookup'
        // that don't exist in the previous query entry, context 'this' is where you
        // should lookup to when constructing you next query parameters if needed be
        const query = Object.entries(params)
          .map(([key]) => key)
          .reduce((acc, curr) => ({ ...acc, [curr]: this._doc[curr] }), {})
        return model({ name }).find(query)
      },
      delete () {
        return model.call(this).deleteMany({})
      }
    }
    return (mongooseMethods)[param]
  }
})
