/* eslint-disable react-refresh/only-export-components -- This module only configures the router. */
import { lazy } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/admin-layout'
import { MemberLayout } from '@/components/layout/member-layout'
import { NotFoundPage } from '@/components/feedback/not-found-page'
import { RouteErrorPage } from '@/components/feedback/route-error-page'
import { HomeRedirect, RequireRole, RequireSession } from '@/features/auth/components/require-auth'
import { ROUTES } from '@/lib/constants'

const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/dashboard-page').then((module) => ({
    default: module.DashboardPage,
  })),
)

const MemberDashboardPage = lazy(() =>
  import('@/features/dashboard/pages/member-dashboard-page').then((module) => ({
    default: module.MemberDashboardPage,
  })),
)

const GroupsPage = lazy(() =>
  import('@/features/groups/pages/groups-page').then((module) => ({
    default: module.GroupsPage,
  })),
)

const InstallmentsPage = lazy(() =>
  import('@/features/groups/pages/installments-page').then((module) => ({
    default: module.InstallmentsPage,
  })),
)

const GroupDetailPage = lazy(() =>
  import('@/features/groups/pages/group-detail-page').then((module) => ({
    default: module.GroupDetailPage,
  })),
)

const MemberGroupsPage = lazy(() =>
  import('@/features/groups/pages/member-groups-page').then((module) => ({
    default: module.MemberGroupsPage,
  })),
)

const PaymentsPage = lazy(() =>
  import('@/features/payments/pages/payments-page').then((module) => ({
    default: module.PaymentsPage,
  })),
)

const MemberPaymentsPage = lazy(() =>
  import('@/features/payments/pages/member-payments-page').then((module) => ({
    default: module.MemberPaymentsPage,
  })),
)

const PayoutsPage = lazy(() =>
  import('@/features/payouts/pages/payouts-page').then((module) => ({
    default: module.PayoutsPage,
  })),
)

const ProfilePage = lazy(() =>
  import('@/features/profile/pages/profile-page').then((module) => ({
    default: module.ProfilePage,
  })),
)

const LoginPage = lazy(() =>
  import('@/features/auth/pages/login-page').then((module) => ({ default: module.LoginPage })),
)

const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/pages/forgot-password-page').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
)

const ResetPasswordPage = lazy(() =>
  import('@/features/auth/pages/reset-password-page').then((module) => ({
    default: module.ResetPasswordPage,
  })),
)

const CompleteProfilePage = lazy(() =>
  import('@/features/auth/pages/complete-profile-page').then((module) => ({
    default: module.CompleteProfilePage,
  })),
)

const SignUpPage = lazy(() =>
  import('@/features/auth/pages/sign-up-page').then((module) => ({
    default: module.SignUpPage,
  })),
)

const InitialAdminSetupPage = lazy(() =>
  import('@/features/auth/pages/initial-admin-setup-page').then((module) => ({
    default: module.InitialAdminSetupPage,
  })),
)

const AdminMembersPage = lazy(() =>
  import('@/features/members/pages/admin-members-page').then((module) => ({
    default: module.AdminMembersPage,
  })),
)

const MemberInstallmentsPage = lazy(() =>
  import('@/features/groups/pages/member-installments-page').then((module) => ({
    default: module.MemberInstallmentsPage,
  })),
)

const UserManagementPage = lazy(() =>
  import('@/features/users/pages/user-management-page').then((module) => ({
    default: module.UserManagementPage,
  })),
)

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      { path: ROUTES.home, element: <HomeRedirect /> },
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.signUp, element: <SignUpPage /> },
      { path: ROUTES.initialAdminSetup, element: <InitialAdminSetupPage /> },
      { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
      { path: ROUTES.resetPassword, element: <ResetPasswordPage /> },
      {
        element: <RequireSession />,
        children: [{ path: ROUTES.completeProfile, element: <CompleteProfilePage /> }],
      },
      {
        // Role guards are navigation aids only. PostgreSQL RLS remains the
        // security boundary for every row the app reads or writes.
        element: <RequireRole role="admin" />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: 'dashboard', element: <DashboardPage /> },
              { path: 'groups', element: <GroupsPage /> },
              { path: 'groups/:groupId', element: <GroupDetailPage /> },
              { path: 'members', element: <AdminMembersPage /> },
              { path: 'user-management', element: <UserManagementPage /> },
              { path: 'installments', element: <InstallmentsPage /> },
              { path: 'payments', element: <PaymentsPage /> },
              { path: 'payouts', element: <PayoutsPage /> },
              { path: 'profile', element: <ProfilePage /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole role="member" />,
        children: [
          {
            path: '/member',
            element: <MemberLayout />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: 'dashboard', element: <MemberDashboardPage /> },
              { path: 'groups', element: <MemberGroupsPage /> },
              { path: 'installments', element: <MemberInstallmentsPage /> },
              { path: 'payments', element: <MemberPaymentsPage /> },
              { path: 'profile', element: <ProfilePage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
