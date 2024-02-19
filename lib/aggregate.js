import { Mongo, MongoInternals } from 'meteor/mongo'
import { Meteor } from 'meteor/meteor'

if (!Mongo.Collection.prototype.aggregate) {
  Mongo.Collection.prototype.aggregate = function (pipelines, options) {
    const Collection = this.rawCollection()

    if (MongoInternals.NpmModules.mongodb.version[0] === '4') {
      return Collection.aggregate(pipelines, options).toArray()
    }

    // return Collection.aggregate(pipelines, options).toArray()
  }
}
