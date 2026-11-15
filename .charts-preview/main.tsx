import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { MemberChartsView } from '@/features/charts/components/member-charts-view'
import type { MemberPayoutSeries } from '@/features/charts/types'
import '@/styles/globals.css'

function point(
  id: string,
  date: string,
  amount: number,
  cumulative: number,
  groupName: string,
  cycleName: string,
) {
  return {
    id,
    date,
    dateLabel: date.slice(8, 10) + ' ' + date.slice(5, 7),
    axisKey: `${date}#${id}`,
    amount,
    cumulative,
    groupName,
    cycleName,
  }
}

const members: { id: string; name: string; series: MemberPayoutSeries }[] = [
  {
    id: 'm1',
    name: 'Anushree Fulzele',
    series: {
      points: [
        point('p1', '2026-10-12', 20000, 20000, 'Family Bhishi', 'Cycle 1'),
        point('p2', '2026-12-12', 10000, 30000, 'Office Bhishi', 'Cycle 1'),
        point('p3', '2026-12-12', 12000, 42000, 'Office Bhishi', 'Cycle 2'),
        point('p4', '2027-03-12', 20000, 62000, 'Family Bhishi', 'Cycle 2'),
      ],
      totalReceived: 62000,
      payoutCount: 4,
    },
  },
  {
    id: 'm2',
    name: 'Pooja Deshmukh',
    series: {
      points: [point('p5', '2026-11-05', 45000, 45000, 'Family Bhishi', 'Cycle 1')],
      totalReceived: 45000,
      payoutCount: 1,
    },
  },
  {
    id: 'm3',
    name: 'Sanket Fulzele',
    series: { points: [], totalReceived: 0, payoutCount: 0 },
  },
]

function Preview() {
  const [selectedId, setSelectedId] = useState(members[0]!.id)
  const selected = members.find((member) => member.id === selectedId) ?? members[0]!

  return (
    <div className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 sm:py-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <PageHeader
          title="Member Charts"
          description="Follow each member's payout journey across every group, cycle and installment."
        />

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="max-w-sm space-y-2">
              <Label htmlFor="chart-member">Select member</Label>
              <Select
                id="chart-member"
                value={selected.id}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <div data-testid="charts">
          <MemberChartsView memberName={selected.name} series={selected.series} />
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Preview />)
