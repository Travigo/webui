import axios from 'axios'
import API from '@/API'
import { getApiAccessToken } from '@/auth'

const COMMUTES_URL = `${API.URL}/core/commutes`

async function authenticatedConfig(auth0) {
  return {
    headers: { Authorization: `Bearer ${await getApiAccessToken(auth0)}` }
  }
}

export default {
  async list(auth0) {
    const response = await axios.get(COMMUTES_URL, await authenticatedConfig(auth0))
    return Array.isArray(response.data) ? response.data : []
  },
  async create(auth0, commute) {
    const response = await axios.post(COMMUTES_URL, commute, await authenticatedConfig(auth0))
    return response.data
  },
  async update(auth0, commute) {
    const response = await axios.put(`${COMMUTES_URL}/${encodeURIComponent(commute.id)}`, commute, await authenticatedConfig(auth0))
    return response.data
  },
  async delete(auth0, identifier) {
    return axios.delete(`${COMMUTES_URL}/${encodeURIComponent(identifier)}`, await authenticatedConfig(auth0))
  }
}
