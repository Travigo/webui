import axios from 'axios'
import API from '@/API'
import { getApiAccessToken } from '@/auth'
import {
  notificationReferenceForSubscription,
  notificationRuleForSubscription,
  subscriptionValuesForNotificationRule
} from '@/notificationRuleTypes'

const NOTIFICATION_SUBSCRIPTIONS_URL = `${API.URL}/core/notification_subscriptions`

async function authenticatedConfig(auth0, params = undefined) {
  const token = await getApiAccessToken(auth0)

  return {
    headers: {
      Authorization: `Bearer ${token}`
    },
    params
  }
}

function subscriptionPayload(subscription) {
  return subscriptionValuesForNotificationRule(subscription)
}

export function normaliseNotificationSubscription(subscription) {
  const storedValues = subscription?.values || {}
  const reference = notificationReferenceForSubscription(subscription || {})
  const editableRule = notificationRuleForSubscription(subscription || {})

  return {
    id: subscription?.id || '',
    entityType: reference.type,
    entityName: reference.type ? `${reference.type} details unavailable` : 'Notification subject unavailable',
    entityDescription: '',
    entityIdentifier: reference.identifier,
    entityResolved: false,
    eventType: subscription?.eventType || '',
    storedValues,
    resolvedValues: {},
    ...editableRule,
    creationDateTime: subscription?.createdAt,
    modificationDateTime: subscription?.updatedAt
  }
}

function entityDisplayName(entityType, entity) {
  if (entityType === 'Stop') {
    return entity?.PrimaryName || ''
  }

  if (entityType === 'Service') {
    return entity?.ServiceName || ''
  }

  const path = entity?.Path || []
  const origin = entity?.OriginDisplay || path[0]?.OriginStop?.PrimaryName || ''
  const destination = entity?.DestinationDisplay || path[path.length - 1]?.DestinationStop?.PrimaryName || ''

  if (origin && destination) {
    return `${origin} → ${destination}`
  }

  return destination ? `Journey to ${destination}` : ''
}

function entityDescription(entityType, entity) {
  if (entityType === 'Stop') {
    return entity?.Descriptor || ''
  }

  if (entityType === 'Service') {
    return entity?.TransportType || ''
  }

  const serviceName = entity?.Service?.ServiceName || ''
  const operatorName = entity?.Operator?.PrimaryName || ''

  return serviceName === operatorName
    ? serviceName
    : [serviceName, operatorName].filter(Boolean).join(' · ')
}

function hydrateNotificationSubscription(subscription) {
  const normalised = normaliseNotificationSubscription(subscription)
  const platformStopRefs = normalised.values?.platformStopRefs || []

  const subject = subscription?.subject || null
  const platformStopsByIdentifier = new Map((subscription?.platformStops || []).map(stop => [stop?.PrimaryIdentifier, stop]))

  const subjectName = entityDisplayName(normalised.entityType, subject)
  const resolvedPlatformStops = platformStopRefs.map((stopRef, index) => {
    const stop = platformStopsByIdentifier.get(stopRef)
    return {
      value: stopRef,
      label: entityDisplayName('Stop', stop) || `Stop ${index + 1}`,
      description: entityDescription('Stop', stop)
    }
  })

  return {
    ...normalised,
    entityName: subjectName || normalised.entityName,
    entityDescription: entityDescription(normalised.entityType, subject),
    entityResolved: Boolean(subjectName),
    resolvedValues: {
      platformStopRefs: resolvedPlatformStops
    }
  }
}

export default {
  async list(auth0) {
    const response = await axios.get(NOTIFICATION_SUBSCRIPTIONS_URL, await authenticatedConfig(auth0, { view: 'web' }))
    const subscriptions = Array.isArray(response.data) ? response.data : []

    return subscriptions.map(subscription => hydrateNotificationSubscription(subscription))
  },
  async quota(auth0) {
    const response = await axios.get(`${NOTIFICATION_SUBSCRIPTIONS_URL}/quota`, await authenticatedConfig(auth0))
    const quota = response.data || {}

    return {
      used: quota.used ?? 0,
      limit: quota.limit ?? 0,
      remaining: quota.remaining ?? 0
    }
  },
  async create(auth0, subscription) {
    const response = await axios.post(
      NOTIFICATION_SUBSCRIPTIONS_URL,
      subscriptionPayload(subscription),
      await authenticatedConfig(auth0, { view: 'web' })
    )

    return hydrateNotificationSubscription(response.data)
  },
  async update(auth0, subscription) {
    const response = await axios.put(
      `${NOTIFICATION_SUBSCRIPTIONS_URL}/${encodeURIComponent(subscription.id)}`,
      subscriptionPayload(subscription),
      await authenticatedConfig(auth0, { view: 'web' })
    )

    return hydrateNotificationSubscription(response.data)
  },
  async delete(auth0, identifier) {
    return axios.delete(
      `${NOTIFICATION_SUBSCRIPTIONS_URL}/${encodeURIComponent(identifier)}`,
      await authenticatedConfig(auth0)
    )
  }
}
