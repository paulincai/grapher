import applyProps from '../lib/applyProps.js'
import prepareForDelivery from '../lib/prepareForDelivery.js'
import storeHypernovaResults from './storeHypernovaResults.js'

async function hypernova (collectionNode, userId) {
  for (const childCollectionNode of collectionNode.collectionNodes) {
    await storeHypernovaResults(childCollectionNode, userId)
    await hypernova(childCollectionNode, userId)
  }
}

export default async function hypernovaInit (collectionNode, userId, config = {}) {
  // const bypassFirewalls = config.bypassFirewalls || false
  const params = config.params || {}

  const { filters, options } = applyProps(collectionNode)

  const collection = collectionNode.collection

  collectionNode.results = await collection.find(filters, options, userId).fetch()

  const userIdToPass = (config.bypassFirewalls) ? undefined : userId
  await hypernova(collectionNode, userIdToPass)

  prepareForDelivery(collectionNode, params)

  return collectionNode.results
}
