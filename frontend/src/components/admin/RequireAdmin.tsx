import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const isStaff = useAuthStore((s) => s.isStaff)
  if (!token) return <Navigate to="/login" replace />
  if (!isStaff) return <Navigate to="/app" replace />
  return <>{children}</>
}
