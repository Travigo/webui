const API_URL = process.env.NODE_ENV === 'development' ? '/api' : 'https://api.travigo.app'

export default {
  URL: API_URL,
  BATCH_URL: import.meta.env.VITE_BATCH_API_URL || (process.env.NODE_ENV === 'development' ? '/batch-api' : `${API_URL}/data-importer`)
}
