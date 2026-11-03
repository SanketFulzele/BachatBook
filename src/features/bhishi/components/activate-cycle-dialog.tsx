import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast-context'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useActivateDraftCycle } from '../hooks/use-bhishi'
import type { CycleView } from '../types'

interface ActivateCycleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupName: string
  cycle: CycleView
}

/**
 * Read-only confirmation of everything the activation will lock in.
 * The actual validation and schedule generation happen in one database
 * transaction, so this screen never writes anything itself.
 */
export function ActivateCycleDialog({
  open,
  onOpenChange,
  groupName,
  cycle,
}: ActivateCycleDialogProps) {
  if (!open) return null

  return (
    <ActivateCycleForm groupName={groupName} cycle={cycle} onClose={() => onOpenChange(false)} />
  )
}

function ActivateCycleForm({
  groupName,
  cycle,
  onClose,
}: {
  groupName: string
  cycle: CycleView
  onClose: () => void
}) {
  const { toast } = useToast()
  const mutation = useActivateDraftCycle()
  const row = cycle.cycle

  const handleActivate = () => {
    mutation.mutate(row.id, {
      onSuccess: () => {
        toast({
          title: 'Cycle activated',
          description: 'The chit order is locked and the monthly schedule is ready.',
          variant: 'success',
        })
        onClose()
      },
      onError: (error) => {
        toast({
          title: 'Could not activate the cycle',
          description: error.message,
          variant: 'error',
        })
      },
    })
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      size="lg"
      title="Activate cycle?"
      description="Check the details below. The chit order is locked after activation."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Not yet
          </Button>
          <Button onClick={handleActivate} isLoading={mutation.isPending}>
            Activate cycle
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border px-3.5 py-3">
          <p className="text-xs text-muted-foreground">Group</p>
          <p className="mt-0.5 text-base font-semibold text-secondary">{groupName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {cycle.members.length} members · Starts {formatDate(row.start_date)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border px-3.5 py-3">
            <p className="text-xs text-muted-foreground">Monthly contribution</p>
            <p className="mt-1 text-base font-semibold">
              {formatCurrency(row.contribution_amount_snapshot)}
            </p>
          </div>
          <div className="rounded-xl border border-border px-3.5 py-3">
            <p className="text-xs text-muted-foreground">Collection day</p>
            <p className="mt-1 text-base font-semibold">{row.collection_day_snapshot}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Recipient order</p>
          <ol className="divide-y divide-border rounded-xl border border-border">
            {cycle.members.map((entry) => (
              <li key={entry.cycleMember.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                  {entry.cycleMember.chit_number}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {entry.member.full_name}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-foreground">
          Bachat Book will create one installment for every month of this cycle. The order cannot be
          changed afterwards.
        </p>
      </div>
    </Dialog>
  )
}
