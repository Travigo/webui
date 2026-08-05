import { reportRequestFailure, reportRequestSuccess } from './connectivity'

const DATABASE_NAME = 'travigo-offline'
const DATABASE_VERSION = 1
const RESOURCE_STORE = 'resources'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

export const CACHE_REVALIDATE_AFTER = {
  stop: 30 * 60 * 1000
}

export const CACHE_MAX_AGE = {
  board: 6 * HOUR,
  entity: 7 * DAY,
  savedItems: 7 * DAY
}

export const cacheKeys = {
  arrivals: (identifier, datetime = 'now') => `arrivals:${identifier}:${datetime}`,
  departures: (identifier, datetime = 'now') => `departures:${identifier}:${datetime}`,
  journey: identifier => `journey:${identifier}`,
  savedItems: 'saved-items',
  stop: identifier => `stop:${identifier}`,
  stopDetails: identifier => `stop-details:${identifier}`,
  stopOSM: identifier => `stop-osm:${identifier}`
}

export function cacheAgeLabel(savedAt, now = Date.now()) {
  const seconds = Math.max(Math.round((now - new Date(savedAt).getTime()) / 1000), 0)

  if (seconds < 60) {
    return 'just now'
  }

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `${minutes} min ago`
  }

  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return `${hours} hr ago`
  }

  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

let databasePromise

function openDatabase() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available'))
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(RESOURCE_STORE)) {
          request.result.createObjectStore(RESOURCE_STORE, { keyPath: 'key' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  return databasePromise
}

function storedKey(key, scope) {
  return `${scope}:${key}`
}

function copyData(data) {
  if (data === undefined) {
    return undefined
  }

  return JSON.parse(JSON.stringify(data))
}

async function resourceRequest(mode, action) {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(RESOURCE_STORE, mode)
    const request = action(transaction.objectStore(RESOURCE_STORE))

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getCachedResource(key, options = {}) {
  const scope = options.scope || 'public'

  try {
    const record = await resourceRequest('readonly', store => store.get(storedKey(key, scope)))

    if (!record) {
      return null
    }

    if (options.maxAgeMs && Date.now() - record.savedAt > options.maxAgeMs) {
      resourceRequest('readwrite', store => store.delete(record.key)).catch(() => undefined)
      return null
    }

    return record
  } catch {
    return null
  }
}

export async function putCachedResource(key, data, options = {}) {
  const scope = options.scope || 'public'
  const record = {
    key: storedKey(key, scope),
    data: copyData(data),
    savedAt: Date.now()
  }

  try {
    await resourceRequest('readwrite', store => store.put(record))
  } catch {
    // Offline storage can be unavailable or evicted; the network result remains usable.
  }

  return record
}

export async function loadCachedResource({ key, maxAgeMs, onCached, request, revalidateAfterMs = 0, scope = 'public' }) {
  const requestResource = () => Promise.resolve()
    .then(request)
    .then(response => ({ response }))
    .catch(error => ({ error }))
  const pendingNetwork = revalidateAfterMs ? null : requestResource()
  const cached = await getCachedResource(key, { maxAgeMs, scope })

  if (cached && onCached) {
    await onCached(cached)
  }

  if (cached && revalidateAfterMs && Date.now() - cached.savedAt < revalidateAfterMs) {
    return {
      data: cached.data,
      savedAt: cached.savedAt,
      source: 'cache'
    }
  }

  const result = await (pendingNetwork || requestResource())

  if (result.response) {
    reportRequestSuccess()
    const record = await putCachedResource(key, result.response.data, { scope })
    return {
      data: result.response.data,
      response: result.response,
      savedAt: record.savedAt,
      source: 'network'
    }
  }

  reportRequestFailure(result.error)

  if (cached) {
    return {
      data: cached.data,
      error: result.error,
      savedAt: cached.savedAt,
      source: 'cache'
    }
  }

  throw result.error
}

function unref(value) {
  return value && typeof value === 'object' && 'value' in value ? value.value : value
}

export function auth0CacheScope(auth0) {
  const user = unref(auth0?.user)
  const claims = unref(auth0?.idTokenClaims)
  const subject = user?.sub || claims?.sub

  return subject ? `user:${subject}` : null
}
