import axios from 'axios'
import { useAuthStore } from '../store/auth'
import { getErrorMessage } from './errors'

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Attach a friendly message so callers can use error.friendlyMessage without
    // re-parsing the response themselves.
    error.friendlyMessage = getErrorMessage(error)
    return Promise.reject(error)
  }
)
