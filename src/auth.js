export const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE || 'https://api.travigo.app'

export function getApiAccessToken(auth0) {
  return auth0.getAccessTokenSilently({
    authorizationParams: {
      audience: AUTH0_AUDIENCE
    }
  })
}
