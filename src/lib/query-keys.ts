/**
 * Central TanStack Query key registry.
 *
 * Rules:
 *   * Never write ad-hoc key arrays inside components or hooks.
 *   * Invalidate the narrowest key that changed; `all` is for bulk resets.
 *   * Keys mirror the database tables generated in
 *     `src/types/database.types.ts`, so cache entries stay predictable when
 *     data fetching arrives in later sprints.
 *
 * No hooks or fetchers live here — this sprint only defines the contract.
 */

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },
  bhishi: {
    all: ['bhishi'] as const,
    /** One compact snapshot for the whole small-group app. */
    snapshot: (profileId: string) => [...queryKeys.bhishi.all, 'snapshot', profileId] as const,
  },
  profiles: {
    all: ['profiles'] as const,
    adminUsers: () => [...queryKeys.profiles.all, 'admin-users'] as const,
    detail: (profileId: string) => [...queryKeys.profiles.all, 'detail', profileId] as const,
    current: () => [...queryKeys.profiles.all, 'current'] as const,
  },
  groups: {
    all: ['groups'] as const,
    detail: (groupId: string) => [...queryKeys.groups.all, 'detail', groupId] as const,
    members: (groupId: string) => [...queryKeys.groups.all, 'members', groupId] as const,
  },
  members: {
    all: ['members'] as const,
    detail: (memberId: string) => [...queryKeys.members.all, 'detail', memberId] as const,
    byProfile: (profileId: string) => [...queryKeys.members.all, 'profile', profileId] as const,
  },
  groupMembers: {
    all: ['group_members'] as const,
    byGroup: (groupId: string) => [...queryKeys.groupMembers.all, 'group', groupId] as const,
  },
  cycles: {
    all: ['cycles'] as const,
    detail: (cycleId: string) => [...queryKeys.cycles.all, 'detail', cycleId] as const,
    byGroup: (groupId: string) => [...queryKeys.cycles.all, 'group', groupId] as const,
  },
  installments: {
    all: ['installments'] as const,
    detail: (installmentId: string) =>
      [...queryKeys.installments.all, 'detail', installmentId] as const,
    byCycle: (cycleId: string) => [...queryKeys.installments.all, 'cycle', cycleId] as const,
  },
  contributionObligations: {
    all: ['contribution_obligations'] as const,
    byInstallment: (installmentId: string) =>
      [...queryKeys.contributionObligations.all, 'installment', installmentId] as const,
    byMember: (memberId: string) =>
      [...queryKeys.contributionObligations.all, 'member', memberId] as const,
  },
  payments: {
    all: ['payments'] as const,
    detail: (paymentId: string) => [...queryKeys.payments.all, 'detail', paymentId] as const,
    byInstallment: (installmentId: string) =>
      [...queryKeys.payments.all, 'installment', installmentId] as const,
    byMember: (memberId: string) => [...queryKeys.payments.all, 'member', memberId] as const,
  },
  payouts: {
    all: ['payouts'] as const,
    detail: (payoutId: string) => [...queryKeys.payouts.all, 'detail', payoutId] as const,
    byInstallment: (installmentId: string) =>
      [...queryKeys.payouts.all, 'installment', installmentId] as const,
    byMember: (memberId: string) => [...queryKeys.payouts.all, 'member', memberId] as const,
  },
  auditLogs: {
    all: ['audit_logs'] as const,
    list: (filters: Record<string, unknown> = {}) =>
      [...queryKeys.auditLogs.all, 'list', filters] as const,
    detail: (auditLogId: string) => [...queryKeys.auditLogs.all, 'detail', auditLogId] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    admin: () => [...queryKeys.dashboard.all, 'admin'] as const,
    member: (memberId: string) => [...queryKeys.dashboard.all, 'member', memberId] as const,
  },
} as const
