import rq from "../../libs/executor.cjs";
import mongoose, { mongo } from "mongoose";

const Model = {};

let opts;

const middleware = (query, options = {}) => {
  if (!Array.isArray(options)) {
    options = [options];
  }
  opts = options || opts;
  return rq(query, {
    methods: {
      get: "get,id",
      find: "find,query",
      create: "create,data",
      update: "update,id|data", // split parameters options
      remove: "remove,id",
      lookup: "lookup",
      delete: "delete",
    },
    config: (param) => {
      for (const opt of options) {
        const { name, fields } = opt || {};
        if (name && fields && !mongoose.models[name]) {
          Model[name] = mongoose.model(name, fields);
        }
      }

      const mongooseMethods = {
        get({ id }) {
          return Model[this.query.key].findById(id);
        },
        find({ query }) {
          return Model[this.query.key].find(query);
        },
        create({ data }) {
          const ins = new Model[this.query.key](data);
          return ins.save();
        },
        update({ id }, { data }) {
          return Model[this.query.key].findByIdAndUpdate(id, data);
        },
        remove({ id }) {
          return Model[this.query.key].findByIdAndRemove(id);
        },
        lookup(result, { name, ...params }) {
          // you can alternatively access query result from context 'this' also
          const query = Object.entries(params)
            .map(([key]) => key)
            .reduce((acc, curr) => ({ ...acc, [curr]: result[curr] }), {});
          return Model[name].find(query);
        },
        delete() {
          return Model[this.query.key].deleteMany({});
        },
      };
      // console.log(mongooseMethods, param)
      return mongooseMethods[param];
    },
  });
};

export default middleware;
