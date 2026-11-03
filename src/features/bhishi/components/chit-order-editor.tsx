import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-context'
import { useSetCycleChitOrder } from '../hooks/use-bhishi'
import type { CycleView } from '../types'

interface ChitOrderEditorProps {
  cycle: CycleView
}

/**
 * Mobile-friendly ordering: one tap moves a member one position up or down.
 * The whole order is saved through the atomic RPC so duplicate positions can
 * never be persisted.
 */
export function ChitOrderEditor({ cycle }: ChitOrderEditorProps) {
  const { toast } = useToast()
  const mutation = useSetCycleChitOrder()
  const members = cycle.members
  const pending = mutation.isPending

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= members.length) return

    const memberIds = members.map((entry) => entry.member.id)
    const current = memberIds[index]
    const next = memberIds[target]
    if (!current || !next) return
    memberIds[index] = next
    memberIds[target] = current

    mutation.mutate(
      {
        cycleId: cycle.cycle.id,
        chitOrder: memberIds.map((memberId, position) => ({
          member_id: memberId,
          chit_number: position + 1,
        })),
      },
      {
        onError: (error) =>
          toast({
            title: 'Could not save the order',
            description: error.message,
            variant: 'error',
          }),
      },
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Chit order</p>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {pending ? 'Saving order…' : 'Chit 1 receives first'}
        </p>
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {members.map((entry, index) => (
          <div key={entry.cycleMember.id} className="flex items-center gap-3 px-3 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{entry.member.full_name}</p>
              {entry.member.phone ? (
                <p className="truncate text-xs text-muted-foreground">{entry.member.phone}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-11 w-11"
                onClick={() => move(index, -1)}
                disabled={pending || index === 0}
                aria-label={`Move ${entry.member.full_name} up`}
              >
                <ChevronUp className="h-5 w-5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-11 w-11"
                onClick={() => move(index, 1)}
                disabled={pending || index === members.length - 1}
                aria-label={`Move ${entry.member.full_name} down`}
              >
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Each member gets exactly one position. The order is locked after activation.
      </p>
    </div>
  )
}
