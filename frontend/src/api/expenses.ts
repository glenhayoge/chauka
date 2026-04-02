import { apiClient } from './client'
import type { Expense } from './types'

export async function createExpense(
  logframeId: number,
  body: { budget_line_id: number; amount: number; description?: string; date: string },
): Promise<Expense> {
  const { data } = await apiClient.post<Expense>(`/logframes/${logframeId}/expenses/`, body)
  return data
}

export async function deleteExpense(logframeId: number, expenseId: number): Promise<void> {
  await apiClient.delete(`/logframes/${logframeId}/expenses/${expenseId}`)
}
