import axios from 'axios'

export const TOKEN_KEY = 'pizza_token'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Readable message from any API error
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message || (err?.request && !err?.response ? 'Cannot reach the server. Is it running?' : fallback)

export default api
