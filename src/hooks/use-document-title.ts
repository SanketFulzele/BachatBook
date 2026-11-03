import { useEffect } from 'react'
import { APP_NAME } from '@/lib/constants'

/** Set a page-specific document title, e.g. `Dashboard · Bachat Book`. */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : `${APP_NAME} — Together We Save. Simply.`
  }, [title])
}
