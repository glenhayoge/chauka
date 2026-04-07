import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import Layout from './components/layout/Layout'
import ToastContainer from './components/ui/ToastContainer'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const InviteAcceptPage = lazy(() => import('./pages/InviteAcceptPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const DocsLayout = lazy(() => import('./docs-ui/DocsLayout'))
const DocsIndex = lazy(() => import('./docs-ui/DocsIndex'))
const DocPage = lazy(() => import('./docs-ui/DocPage'))
const HelpLayout = lazy(() => import('./help-ui/HelpLayout'))
const HelpIndex = lazy(() => import('./help-ui/HelpIndex'))
const HelpPage = lazy(() => import('./help-ui/HelpPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const OrgSelectPage = lazy(() => import('./pages/OrgSelectPage'))
const LogframeSelectPage = lazy(() => import('./pages/LogframeSelectPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const OverviewPage = lazy(() => import('./pages/OverviewPage'))
const ResultDesignPage = lazy(() => import('./pages/ResultDesignPage'))
const MonitorPage = lazy(() => import('./pages/MonitorPage'))
const BudgetPage = lazy(() => import('./pages/BudgetPage'))
const GanttPage = lazy(() => import('./pages/GanttPage'))
const WorkloadPage = lazy(() => import('./pages/WorkloadPage'))
const PeoplePage = lazy(() => import('./pages/PeoplePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const OrgSettingsPage = lazy(() => import('./pages/OrgSettingsPage'))
const PrintLogframePage = lazy(() => import('./pages/PrintLogframePage'))
const OrgDashboardPage = lazy(() => import('./pages/OrgDashboardPage'))
const IndicatorLibraryPage = lazy(() => import('./pages/IndicatorLibraryPage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const RequireAdmin = lazy(() => import('./components/admin/RequireAdmin'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminOrgsPage = lazy(() => import('./pages/admin/AdminOrgsPage'))
const AdminRBACPage = lazy(() => import('./pages/admin/AdminRBACPage'))
const AdminMicroAppsPage = lazy(() => import('./pages/admin/AdminMicroAppsPage'))
const AdminFilesPage = lazy(() => import('./pages/admin/AdminFilesPage'))
const DisaggregationPage = lazy(() => import('./pages/DisaggregationPage'))
const ContributionPage = lazy(() => import('./pages/ContributionPage'))

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/" replace />
  return <>{children}</>
}

function PageLoader() {
  return <p className="text-foreground text-sm p-6">Loading…</p>
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/invite/:token" element={<InviteAcceptPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/docs" element={<DocsLayout />}>
            <Route index element={<DocsIndex />} />
            <Route path="*" element={<DocPage />} />
          </Route>
          <Route path="/help" element={<HelpLayout />}>
            <Route index element={<HelpIndex />} />
            <Route path="*" element={<HelpPage />} />
          </Route>

          {/* Authenticated standalone pages */}
          <Route path="/profile" element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<ProfilePage />} />
          </Route>
          <Route path="/organisations/:orgId/settings" element={<RequireAuth><OrgSettingsPage /></RequireAuth>} />
          <Route path="/organisations/:orgId/dashboard" element={<RequireAuth><OrgDashboardPage /></RequireAuth>} />
          <Route path="/organisations/:orgId/indicator-library" element={<RequireAuth><IndicatorLibraryPage /></RequireAuth>} />
          <Route path="/app/logframes/:logframeId/print" element={<RequireAuth><PrintLogframePage /></RequireAuth>} />

          {/* Admin portal */}
          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="organisations" element={<AdminOrgsPage />} />
            <Route path="rbac" element={<AdminRBACPage />} />
            <Route path="micro-apps" element={<AdminMicroAppsPage />} />
            <Route path="files" element={<AdminFilesPage />} />
          </Route>

          {/* Authenticated app */}
          <Route
            path="/app"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<OrgSelectPage />} />
            <Route path="logframes" element={<LogframeSelectPage />} />
            <Route path="logframes/:logframeId" element={<DashboardPage />} />
            <Route path="logframes/:logframeId/overview" element={<OverviewPage />} />
            <Route path="logframes/:logframeId/design" element={<ResultDesignPage />} />
            <Route path="logframes/:logframeId/monitor" element={<MonitorPage />} />
            <Route path="logframes/:logframeId/budget" element={<BudgetPage />} />
            <Route path="logframes/:logframeId/timeline" element={<GanttPage />} />
            <Route path="logframes/:logframeId/workload" element={<WorkloadPage />} />
            <Route path="logframes/:logframeId/people" element={<PeoplePage />} />
            <Route path="logframes/:logframeId/settings" element={<SettingsPage />} />
            <Route path="logframes/:logframeId/disaggregation" element={<DisaggregationPage />} />
            <Route path="logframes/:logframeId/contribution" element={<ContributionPage />} />
          </Route>
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  )
}
