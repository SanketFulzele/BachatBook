export const APP_NAME = 'Bachat Book'
export const APP_TAGLINE = 'Together We Save. Simply.'
export const APP_DESCRIPTION =
  'A simple, transparent way for Bhishi groups to manage contributions, cycles and payouts.'

export const ROUTES = {
  home: '/',
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  completeProfile: '/complete-profile',
  admin: {
    dashboard: '/admin/dashboard',
    groups: '/admin/groups',
    group: (groupId: string) => `/admin/groups/${groupId}`,
    installments: '/admin/installments',
    payments: '/admin/payments',
    payouts: '/admin/payouts',
    profile: '/admin/profile',
  },
  member: {
    dashboard: '/member/dashboard',
    groups: '/member/groups',
    payments: '/member/payments',
    profile: '/member/profile',
  },
} as const

export const DEFAULT_CURRENCY = 'INR'
export const DEFAULT_LOCALE = 'en-IN'
export const DEFAULT_TIME_ZONE = 'Asia/Kolkata'
