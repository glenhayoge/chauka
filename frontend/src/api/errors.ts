import axios from 'axios'

/**
 * Extract a human-readable error message from any thrown value.
 *
 * Priority:
 *  1. `detail` from a FastAPI error response body (string or first item of a list)
 *  2. Status-code-based fallback for common HTTP errors
 *  3. Generic fallback
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const status = error.response?.status
  const data = error.response?.data

  // FastAPI returns { detail: string | ValidationError[] }
  if (data?.detail) {
    if (typeof data.detail === 'string') {
      return data.detail
    }
    // Pydantic validation error list — surface the first message
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0]
      if (typeof first?.msg === 'string') return first.msg
    }
  }

  // Status-code fallbacks
  switch (status) {
    case 400: return 'Invalid request. Please check your input.'
    case 401: return 'You are not logged in.'
    case 403: return 'You do not have permission to do that.'
    case 404: return 'The requested item could not be found.'
    case 409: return 'This action conflicts with existing data. Please check your input and try again.'
    case 422: return 'Invalid data submitted. Please check your input.'
    case 429: return 'Too many requests. Please wait a moment and try again.'
    case 500:
    case 502:
    case 503: return 'A server error occurred. Please try again later.'
    default:  return fallback
  }
}
