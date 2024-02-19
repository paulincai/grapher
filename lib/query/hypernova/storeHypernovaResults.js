import applyProps from '../lib/applyProps.js'
import AggregateFilters from './aggregateSearchFilters.js'
import assemble from './assembler.js'
import assembleAggregateResults from './assembleAggregateResults.js'
import buildAggregatePipeline from './buildAggregatePipeline.js'
import snapBackDottedFields from './lib/snapBackDottedFields'
import { _ } from 'meteor/underscore'

export default async function storeHypernovaResults (childCollectionNode, userId) {
  const results = childCollectionNode.parent.results
  if (results.length === 0) {
    return (childCollectionNode.results = [])
  }

  const { filters, options } = applyProps(childCollectionNode)

  const metaFilters = filters.$meta
  const aggregateFilters = new AggregateFilters(
    childCollectionNode,
    metaFilters
  )
  delete filters.$meta

  const linker = childCollectionNode.linker
  const isVirtual = linker.isVirtual()
  const collection = childCollectionNode.collection

  _.extend(filters, aggregateFilters.create())

  // if it's not virtual then we retrieve them and assemble them here.
  if (!isVirtual) {
    const filteredOptions = _.omit(options, 'limit')

    childCollectionNode.results = await collection
      .find(filters, filteredOptions, userId)
      .fetch()
    assemble(childCollectionNode, {
      ...options,
      metaFilters
    })
  } else {
    // virtuals arrive here
    const { pipeline, containsDottedFields } = buildAggregatePipeline(
      childCollectionNode,
      filters,
      options,
      userId
    )

    const aggregateResults = await collection.aggregate(pipeline)

    /**
     * If in aggregation it contains '.', we replace it with a custom string '___'
     * And then after aggregation is complete we need to snap-it back to how it was.
     */
    if (containsDottedFields) {
      snapBackDottedFields(aggregateResults)
    }

    assembleAggregateResults(
      childCollectionNode,
      aggregateResults,
      metaFilters
    )
  }
}
