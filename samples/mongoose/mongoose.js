const queryExec = require('../../libs/executor')
const mongoose = require('mongoose')

module.exports = (query, { name, fields }) => queryExec(query, {
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
    const createModel = ({ name, fields }) => {
      if (!mongoose.models[name]) {
        return mongoose.model(name, fields)
      } else {
        return mongoose.models[name]
      }
    }
    const model = createModel({ name, fields })

    const mongooseMethods = {
      get ({ id }) {
        return model.findById(id)
      },
      find ({ query }) {
        return model.find(query)
      },
      create ({ data }) {
        const ins = new model(data)
        return ins.save()
      },
      update ({ id }, { data }) {
        return model.findByIdAndUpdate(id, data)
      },
      remove ({ id }) {
        return model.findByIdAndRemove(id)
      },
      lookup ({ model, ...param }) {
        const [[key]] = Object.entries(param)
        return createModel(model).find({
          [key]: this._doc[key] // context of previous query result
        })
      },
      delete () {
        return model.deleteMany({})
      }
    }
    return (mongooseMethods)[param]
  }
})
