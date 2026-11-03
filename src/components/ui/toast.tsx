import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToastContext, type ToastOptions, type ToastVariant } from '@/components/ui/toast-context'

interface ToastRecord extends Required<Pick<ToastOptions, 'title' | 'variant' | 'duration'>> {
  id: string
  description?: string
}

const variantConfig: Record<
  ToastVariant,
  { icon: typeof Info; classes: string; iconClasses: string }
> = {
  success: {
    icon: CheckCircle2,
    classes: 'border-success/25',
    iconClasses: 'text-success',
  },
  error: {
    icon: XCircle,
    classes: 'border-destructive/25',
    iconClasses: 'text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'border-warning/30',
    iconClasses: 'text-warning',
  },
  info: {
    icon: Info,
    classes: 'border-primary/20',
    iconClasses: 'text-primary',
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const timers = useRef(new Map<string, number>())
  const counter = useRef(0)

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    (options: ToastOptions) => {
      counter.current += 1
      const id = `toast-${counter.current}`
      const duration = options.duration ?? 5000
      const record: ToastRecord = {
        id,
        title: options.title,
        variant: options.variant ?? 'info',
        duration,
        ...(options.description ? { description: options.description } : {}),
      }

      setToasts((current) => [...current.slice(-2), record])
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), duration),
      )
    },
    [dismiss],
  )

  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer))
      activeTimers.clear()
    }
  }, [])

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          aria-label="Notifications"
          className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px]"
        >
          {toasts.map((item) => {
            const config = variantConfig[item.variant]
            const Icon = config.icon

            return (
              <div
                key={item.id}
                role="status"
                className={cn(
                  'pointer-events-auto flex gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-elevated animate-slide-in-up',
                  config.classes,
                )}
              >
                <Icon
                  className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconClasses)}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="-mr-1 -mt-1 h-7 w-7 shrink-0 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Dismiss notification"
                >
                  <X className="mx-auto h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
