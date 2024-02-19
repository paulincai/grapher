import createGraph from './lib/createGraph.js'
import prepareForProcess from './lib/prepareForProcess.js'
import hypernova from './hypernova/hypernova.js'
import Base from './query.base'
import { _ } from 'meteor/underscore'

export default class Query extends Base {
  /**
   * Retrieves the data.
   * @param context
   * @returns {*}
   */
  async fetch (context = {}) {
    const node = createGraph(
      this.collection,
      prepareForProcess(this.body, this.params)
    )

    return await hypernova(node, context.userId, { params: this.params })
  }

  /**
   * @param context
   * @returns {*}
   */
  fetchOne (context = {}) {
    context.$options = context.$options || {}
    context.$options.limit = 1
    return _.first(this.fetch(context))
  }

  /**
   * Gets the count of matching elements.
   * @returns {integer}
   */
  getCount () {
    return this.collection.find(this.body.$filters || {}, {}).count()
  }
}
