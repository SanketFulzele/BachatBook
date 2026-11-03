import type { ReactNode } from 'react'
import { useDocumentTitle } from '@/hooks/use-document-title'

export interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  actions?: ReactNode
  documentTitle?: string
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  documentTitle,
}: PageHeaderProps) {
  useDocumentTitle(documentTitle ?? title)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-secondary sm:text-[28px]">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
