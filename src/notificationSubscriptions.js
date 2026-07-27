import axios from 'axios'
import API from '@/API'
import { getApiAccessToken } from '@/auth'
import {
  notificationReferenceForSubscription,
  notificationRuleForSubscription,
  subscriptionValuesForNotificationRule
} from '@/notificationRuleTypes'

const NOTIFICATION_SUBSCRIPTIONS_URL = `${API.URL}/core/notification_subscriptions`

async function authenticatedConfig(auth0) {
  const token = await getApiAccessToken(auth0)

  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
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
    entityName: reference.identifier,
    entityIdentifier: reference.identifier,
    eventType: subscription?.eventType || '',
    storedValues,
    ...editableRule,
    creationDateTime: subscription?.createdAt,
    modificationDateTime: subscription?.updatedAt
  }
}

async function hydrateNotificationSubscription(subscription) {
  const normalised = normaliseNotificationSubscription(subscription)

  if (!normalised.entityType || !normalised.entityIdentifier) {
    return normalised
  }

  const resource = {
    Stop: 'stops',
    Service: 'services',
    Journey: 'journeys'
  }[normalised.entityType]

  try {
    const response = await axios.get(
      `${API.URL}/core/${resource}/${encodeURIComponent(normalised.entityIdentifier)}`
    )
    const entity = response.data || {}
    const entityName = {
      Stop: entity.PrimaryName,
      Service: entity.ServiceName,
      Journey: entity.DestinationDisplay || entity.ShortName
    }[normalised.entityType]

    return {
      ...normalised,
      entityName: entityName || normalised.entityIdentifier
    }
  } catch (error) {
    console.log(error)
    return normalised
  }
}

export default {
  async list(auth0) {
    const response = await axios.get(NOTIFICATION_SUBSCRIPTIONS_URL, await authenticatedConfig(auth0))
    const subscriptions = Array.isArray(response.data) ? response.data : []

    return Promise.all(subscriptions.map(hydrateNotificationSubscription))
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
      await authenticatedConfig(auth0)
    )

    return hydrateNotificationSubscription(response.data)
  },
  async update(auth0, subscription) {
    const response = await axios.put(
      `${NOTIFICATION_SUBSCRIPTIONS_URL}/${encodeURIComponent(subscription.id)}`,
      subscriptionPayload(subscription),
      await authenticatedConfig(auth0)
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
