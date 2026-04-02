import { apiClient } from './client'

interface LoginResponse {
  access_token: string
  token_type: string
  user_id: number
  username: string
  is_staff: boolean
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)
  const { data } = await apiClient.post<LoginResponse>('/auth/token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

interface RegisterRequest {
  username: string
  password: string
  email?: string
  first_name?: string
  last_name?: string
}

export async function register(body: RegisterRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/register', body)
  return data
}

// ---------------------------------------------------------------------------
// Password Reset (Issue #36)
// ---------------------------------------------------------------------------

interface ForgotPasswordResponse {
  message: string
  reset_link: string | null
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const { data } = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', { email })
  return data
}

export async function verifyResetToken(token: string): Promise<{ valid: boolean }> {
  const { data } = await apiClient.get<{ valid: boolean }>(`/auth/verify-reset-token/${token}`)
  return data
}

export async function resetPassword(token: string, new_password: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/reset-password', { token, new_password })
  return data
}

// ---------------------------------------------------------------------------
// User Profile (Issue #37)
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  is_staff: boolean
}

export async function getProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/auth/me')
  return data
}

interface UpdateProfileRequest {
  first_name?: string
  last_name?: string
  email?: string
}

export async function updateProfile(body: UpdateProfileRequest): Promise<UserProfile> {
  const { data } = await apiClient.patch<UserProfile>('/auth/me', body)
  return data
}

export async function changePassword(current_password: string, new_password: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/change-password', {
    current_password,
    new_password,
  })
  return data
}
