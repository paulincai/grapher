// import createSearchFilters from '../../links/lib/createSearchFilters'
import cleanObjectForMetaFilters from './lib/cleanObjectForMetaFilters'
import sift from 'sift'
import dot from 'dot-object'
import { _ } from 'meteor/underscore'

export default async (childCollectionNode, { limit, skip, metaFilters }) => {

  if (childCollectionNode.results.length === 0) {
    return
  }

  const { parent, linker } = childCollectionNode || {}

  const strategy = linker.strategy
  // const isSingle = linker.isSingle()
  const isMeta = linker.isMeta()
  const fieldStorage = linker.linkStorageField
  const results = parent.results

  // cleaning the parent results from a child
  // this may be the wrong approach but it works for now
  if (isMeta && metaFilters) {
    const metaFiltersTest = sift(metaFilters)
    _.each(results, parentResult => {
      cleanObjectForMetaFilters(
        parentResult,
        fieldStorage,
        metaFiltersTest
      )
    })
  }

  const resultsByKeyId = _.groupBy(childCollectionNode.results, '_id')

  if (strategy === 'one') {
    results.forEach(parentResult => {
      const value = dot.pick(fieldStorage, parentResult)
      if (!value) {
        return
      }

      parentResult[childCollectionNode.linkName] = filterAssembledData(
        resultsByKeyId[value],
        { limit, skip }
      )
    })
  }

  if (strategy === 'many') {
    results.forEach(parentResult => {
      // support dotted fields
      const [root, ...nested] = fieldStorage.split('.')
      const value = dot.pick(root, parentResult)
      if (!value) {
        return
      }

      const data = []
      value.forEach(v => {
        const _id = nested.length > 0 ? dot.pick(nested.join('.'), v) : v
        data.push(_.first(resultsByKeyId[_id]))
      })

      parentResult[childCollectionNode.linkName] = filterAssembledData(
        data,
        { limit, skip }
      )
    })
  }

  if (strategy === 'one-meta') {
    results.forEach(parentResult => {
      if (!parentResult[fieldStorage]) {
        return
      }

      const _id = parentResult[fieldStorage]._id
      parentResult[childCollectionNode.linkName] = filterAssembledData(
        resultsByKeyId[_id],
        { limit, skip }
      )
    })
  }

  if (strategy === 'many-meta') {
    results.forEach(parentResult => {
      const _ids = _.pluck(parentResult[fieldStorage], '_id')
      const data = []
      _ids.forEach(_id => {
        data.push(_.first(resultsByKeyId[_id]))
      })

      parentResult[childCollectionNode.linkName] = filterAssembledData(
        data,
        { limit, skip }
      )
    })
  }
}

function filterAssembledData (data, { limit, skip }) {
  if (Array.isArray(data)) {
    data = data.filter(Boolean)
    if (limit) {
      return data.slice(skip, limit)
    }
  }

  return data
}
