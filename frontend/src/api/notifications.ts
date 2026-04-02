import { apiClient } from './client'
import type { Notification } from './types'

export async function getNotifications(
  limit = 20,
  offset = 0,
): Promise<Notification[]> {
  const { data } = await apiClient.get<Notification[]>('/notifications/', {
    params: { limit, offset },
  })
  return data
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ unread_count: number }>(
    '/notifications/unread-count',
  )
  return data.unread_count
}

export async function markNotificationRead(
  notificationId: number,
): Promise<Notification> {
  const { data } = await apiClient.patch<Notification>(
    `/notifications/${notificationId}`,
    { read: true },
  )
  return data
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/notifications/mark-all-read')
}
