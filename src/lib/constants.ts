export const APP_NAME = 'Bachify'
export const APP_TAGLINE = 'Together We Save. Simply.'
export const APP_DESCRIPTION =
  'A simple, transparent way for Bhishi groups to manage contributions, cycles and payouts.'

export const ROUTES = {
  home: '/',
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  admin: {
    dashboard: '/admin/dashboard',
    groups: '/admin/groups',
    members: '/admin/members',
    cycles: '/admin/cycles',
    collections: '/admin/collections',
    payouts: '/admin/payouts',
    reports: '/admin/reports',
    auditLogs: '/admin/audit-logs',
    settings: '/admin/settings',
  },
  member: {
    dashboard: '/member/dashboard',
    groups: '/member/groups',
    payments: '/member/payments',
    schedule: '/member/schedule',
    payouts: '/member/payouts',
    profile: '/member/profile',
  },
} as const

export const DEFAULT_CURRENCY = 'INR'
export const DEFAULT_LOCALE = 'en-IN'
export const DEFAULT_TIME_ZONE = 'Asia/Kolkata'
