const SERVICE_ALERT_CREATED = 'ServiceAlertCreated'
const REALTIME_JOURNEY_PLATFORM_SET = 'RealtimeJourneyPlatformSet'
const REALTIME_JOURNEY_PLATFORM_CHANGED = 'RealtimeJourneyPlatformChanged'

export const NOTIFICATION_DAYS_OF_WEEK = Object.freeze([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
])

const PLATFORM_EVENT_TYPES = new Set([
  REALTIME_JOURNEY_PLATFORM_SET,
  REALTIME_JOURNEY_PLATFORM_CHANGED
])

const SERVICE_ALERT_TYPE_OPTIONS = [
  { value: 'Information', label: 'Service update' },
  { value: 'Warning', label: 'Service warning' },
  { value: 'StopClosed', label: 'Stop closed' },
  { value: 'ServiceSuspended', label: 'Service suspended' },
  { value: 'ServicePartSuspended', label: 'Service part suspended' },
  { value: 'SevereDelays', label: 'Severe delays' },
  { value: 'Delays', label: 'Delays' },
  { value: 'MinorDelays', label: 'Minor delays' },
  { value: 'Planned', label: 'Planned notice' },
  { value: 'JourneyDelayed', label: 'Journey delayed' },
  { value: 'JourneyPartiallyCancelled', label: 'Journey partially cancelled' },
  { value: 'JourneyCancelled', label: 'Journey cancelled' }
]

const REALTIME_JOURNEY_EVENT_OPTIONS = [
  { value: 'RealtimeJourneyCreated', label: 'Created' },
  { value: 'RealtimeJourneyActivelyTracked', label: 'Actively tracked' },
  { value: REALTIME_JOURNEY_PLATFORM_SET, label: 'Platform set' },
  { value: REALTIME_JOURNEY_PLATFORM_CHANGED, label: 'Platform changed' },
  { value: 'RealtimeJourneyCancelled', label: 'Cancelled' },
  { value: 'RealtimeJourneyOverlayCreated', label: 'Replaced' },
  { value: 'RealtimeJourneyLocationTextChanged', label: 'Location text changed' },
  { value: 'RealtimeJourneyNextStopChanged', label: 'Next stop changed' }
]

function notificationDaysField() {
  return {
    id: 'daysOfWeek',
    label: 'Days of week',
    type: 'multi-select',
    placeholder: 'Select days',
    allSelectedLabel: 'Every day',
    selectionNoun: 'days',
    description: 'Choose the days when this notification may trigger.',
    defaultValue: [...NOTIFICATION_DAYS_OF_WEEK],
    options: NOTIFICATION_DAYS_OF_WEEK.map(day => ({ value: day, label: day }))
  }
}

function serviceAlertRuleType() {
  return {
    id: 'service-alert',
    label: 'Service alerts',
    icon: 'campaign',
    fields: [
      {
        id: 'serviceAlertTypes',
        label: 'Alert types',
        type: 'multi-select',
        placeholder: 'Select alert types',
        allSelectedLabel: 'All alert types',
        selectionNoun: 'alert types',
        description: 'Choose which service alerts should trigger this notification.',
        options: SERVICE_ALERT_TYPE_OPTIONS
      },
      notificationDaysField()
    ]
  }
}

function realtimeJourneyRuleType(stopOptions) {
  return {
    id: 'realtime-journey',
    label: 'Live journey change',
    icon: 'rss_feed',
    fields: [
      {
        id: 'realtimeJourneyEvent',
        label: 'Journey change',
        type: 'select',
        placeholder: 'Select a journey change',
        description: 'Each notification subscription monitors one event.',
        options: REALTIME_JOURNEY_EVENT_OPTIONS
      },
      {
        id: 'platformStopRefs',
        label: 'Stops for platform changes',
        type: 'multi-select',
        placeholder: 'Select stops',
        allSelectedLabel: 'All stops',
        selectionNoun: 'stops',
        description: 'Choose the journey stops where platform changes matter.',
        visibleWhen: {
          fieldId: 'realtimeJourneyEvent',
          includesAny: [...PLATFORM_EVENT_TYPES]
        },
        options: stopOptions
      },
      notificationDaysField()
    ]
  }
}

export function notificationRuleTypesForSubject(subjectType, options = {}) {
  if (!['stop', 'journey', 'service'].includes(String(subjectType || '').toLowerCase())) {
    return []
  }

  const ruleTypes = [serviceAlertRuleType()]
  if (String(subjectType).toLowerCase() === 'journey') {
    ruleTypes.push(realtimeJourneyRuleType(options.stopOptions || []))
  }

  return ruleTypes
}

function referenceValues(rule) {
  const referenceKey = {
    stop: 'StopRef',
    journey: 'JourneyRef',
    service: 'ServiceRef'
  }[String(rule.entityType || '').toLowerCase()]

  return referenceKey && rule.entityIdentifier
    ? { [referenceKey]: rule.entityIdentifier }
    : {}
}

function normaliseDaysOfWeek(days) {
  const selectedDays = Array.isArray(days)
    ? [...new Set(days)].filter(day => NOTIFICATION_DAYS_OF_WEEK.includes(day))
    : []

  return selectedDays.length > 0 ? selectedDays : [...NOTIFICATION_DAYS_OF_WEEK]
}

export function subscriptionValuesForNotificationRule(rule) {
  const values = referenceValues(rule)
  const daysOfWeek = normaliseDaysOfWeek(rule.values?.daysOfWeek)

  if (rule.notificationType === 'service-alert') {
    return {
      eventType: SERVICE_ALERT_CREATED,
      daysOfWeek,
      values: {
        ...values,
        ServiceAlertTypes: [...new Set(rule.values?.serviceAlertTypes || [])]
      }
    }
  }

  const eventType = rule.values?.realtimeJourneyEvent || ''

  return {
    eventType,
    daysOfWeek,
    values: {
      ...values,
      ...(PLATFORM_EVENT_TYPES.has(eventType)
        ? { StopRefs: [...new Set(rule.values?.platformStopRefs || [])] }
        : {})
    }
  }
}

export function notificationRuleForSubscription(subscription) {
  const storedValues = subscription.values || {}

  if (subscription.eventType === SERVICE_ALERT_CREATED) {
    return {
      notificationType: 'service-alert',
      values: {
        serviceAlertTypes: storedValues.ServiceAlertTypes || [],
        daysOfWeek: normaliseDaysOfWeek(subscription.daysOfWeek)
      }
    }
  }

  return {
    notificationType: 'realtime-journey',
    values: {
      realtimeJourneyEvent: subscription.eventType || '',
      platformStopRefs: storedValues.StopRefs || [],
      daysOfWeek: normaliseDaysOfWeek(subscription.daysOfWeek)
    }
  }
}

export function notificationReferenceForSubscription(subscription) {
  const storedValues = subscription.values || {}

  if (storedValues.StopRef) {
    return { type: 'Stop', identifier: storedValues.StopRef }
  }
  if (storedValues.ServiceRef) {
    return { type: 'Service', identifier: storedValues.ServiceRef }
  }
  if (storedValues.JourneyRef) {
    return { type: 'Journey', identifier: storedValues.JourneyRef }
  }

  return { type: '', identifier: '' }
}
