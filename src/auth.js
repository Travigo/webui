export const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE || 'https://api.travigo.app'
export const DATA_IMPORTER_PERMISSION = 'admin:all'

function customClaims(claims, claimName) {
  return Object.entries(claims || {})
    .filter(([key, value]) => key === claimName || key.endsWith(`/${claimName}`))
    .map(([, value]) => value)
}

export function hasAuth0Permission(claims, permission) {
  return [claims?.permissions, ...customClaims(claims, 'permissions')]
    .some(permissions => Array.isArray(permissions) && permissions.includes(permission))
}

export function getApiAccessToken(auth0) {
  return auth0.getAccessTokenSilently({
    authorizationParams: {
      audience: AUTH0_AUDIENCE
    }
  })
}

export async function getApiAccessTokenClaims(auth0) {
  const response = await auth0.getAccessTokenSilently({
    detailedResponse: true,
    authorizationParams: {
      audience: AUTH0_AUDIENCE
    }
  })
  const payload = response.access_token.split('.')[1]

  if (!payload) {
    return undefined
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = new TextDecoder().decode(Uint8Array.from(atob(base64), character => character.charCodeAt(0)))
    return JSON.parse(json)
  } catch {
    return undefined
  }
}
