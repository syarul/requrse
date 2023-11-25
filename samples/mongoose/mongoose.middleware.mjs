import rq from '../../libs/executor.cjs'
import mongoose from 'mongoose'

const Model = {}

const middleware = (query, opts) => rq(query, {
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
      lookup (result, { name, ...params }) {
        // you can alternatively access query result from context 'this' also
        const query = Object.entries(params)
          .map(([key]) => key)
          .reduce((acc, curr) => ({ ...acc, [curr]: result[curr] }), {})
        return model({ name }).find(query)
      },
      delete () {
        return model.call(this).deleteMany({})
      }
    }
    return (mongooseMethods)[param]
  }
})

export default middleware