import { apiClient } from './client'
import type { Expense } from './types'

export async function createExpense(
  logframeId: string,
  body: { budget_line_id: number; amount: number; description?: string; date: string },
): Promise<Expense> {
  const { data } = await apiClient.post<Expense>(`/logframes/${logframeId}/expenses/`, body)
  return data
}

export async function deleteExpense(logframeId: string, expenseId: number): Promise<void> {
  await apiClient.delete(`/logframes/${logframeId}/expenses/${expenseId}`)
}
