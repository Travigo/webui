let online = typeof navigator === 'undefined' ? true : navigator.onLine
const listeners = new Set()

function updateOnline(nextOnline) {
  if (online === nextOnline) {
    return
  }

  online = nextOnline
  listeners.forEach(listener => listener(online))
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => updateOnline(true))
  window.addEventListener('offline', () => updateOnline(false))
}

export function isConnected() {
  return online
}

export function reportRequestSuccess() {
  updateOnline(true)
}

export function reportRequestFailure(error) {
  if (!error?.response && error?.code !== 'ERR_CANCELED') {
    updateOnline(false)
  }
}

export function subscribeToConnectivity(listener) {
  listeners.add(listener)
  listener(online)
  return () => listeners.delete(listener)
}
