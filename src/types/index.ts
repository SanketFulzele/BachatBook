import type { LucideIcon } from 'lucide-react'

export type UserRole = 'admin' | 'member'

export interface NavigationItem {
  label: string
  href: string
  icon: LucideIcon
  /** Sprint in which the destination becomes functional. */
  availableInSprint?: number
}

export interface NavigationSection {
  title: string
  items: NavigationItem[]
}
