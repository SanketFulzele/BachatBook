/* eslint-disable react-refresh/only-export-components -- This module only configures the router. */
import { lazy } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/admin-layout'
import { MemberLayout } from '@/components/layout/member-layout'
import { ProtectedRoutePlaceholder } from '@/components/layout/protected-route-placeholder'
import { NotFoundPage } from '@/components/feedback/not-found-page'
import { RouteErrorPage } from '@/components/feedback/route-error-page'
import { PlaceholderPage } from '@/components/common/placeholder-page'
import { adminPlaceholders, memberPlaceholders } from '@/app/route-placeholders'
import { ROUTES } from '@/lib/constants'

const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/dashboard-page').then((module) => ({
    default: module.DashboardPage,
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

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      { path: ROUTES.home, element: <Navigate to={ROUTES.admin.dashboard} replace /> },
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
      { path: ROUTES.resetPassword, element: <ResetPasswordPage /> },
      {
        element: <ProtectedRoutePlaceholder />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: 'dashboard', element: <DashboardPage /> },
              {
                path: 'groups',
                element: <PlaceholderPage {...adminPlaceholders.groups} />,
              },
              {
                path: 'members',
                element: <PlaceholderPage {...adminPlaceholders.members} />,
              },
              {
                path: 'cycles',
                element: <PlaceholderPage {...adminPlaceholders.cycles} />,
              },
              {
                path: 'collections',
                element: <PlaceholderPage {...adminPlaceholders.collections} />,
              },
              {
                path: 'payouts',
                element: <PlaceholderPage {...adminPlaceholders.payouts} />,
              },
              {
                path: 'reports',
                element: <PlaceholderPage {...adminPlaceholders.reports} />,
              },
              {
                path: 'audit-logs',
                element: <PlaceholderPage {...adminPlaceholders.auditLogs} />,
              },
              {
                path: 'settings',
                element: <PlaceholderPage {...adminPlaceholders.settings} />,
              },
            ],
          },
          {
            path: '/member',
            element: <MemberLayout />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              {
                path: 'dashboard',
                element: (
                  <PlaceholderPage
                    {...memberPlaceholders.dashboard}
                    dashboardHref={ROUTES.member.dashboard}
                  />
                ),
              },
              {
                path: 'groups',
                element: (
                  <PlaceholderPage
                    {...memberPlaceholders.groups}
                    dashboardHref={ROUTES.member.dashboard}
                  />
                ),
              },
              {
                path: 'payments',
                element: (
                  <PlaceholderPage
                    {...memberPlaceholders.payments}
                    dashboardHref={ROUTES.member.dashboard}
                  />
                ),
              },
              {
                path: 'schedule',
                element: (
                  <PlaceholderPage
                    {...memberPlaceholders.schedule}
                    dashboardHref={ROUTES.member.dashboard}
                  />
                ),
              },
              {
                path: 'payouts',
                element: (
                  <PlaceholderPage
                    {...memberPlaceholders.payouts}
                    dashboardHref={ROUTES.member.dashboard}
                  />
                ),
              },
              {
                path: 'profile',
                element: (
                  <PlaceholderPage
                    {...memberPlaceholders.profile}
                    dashboardHref={ROUTES.member.dashboard}
                  />
                ),
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
