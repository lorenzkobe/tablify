import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'
import Link from 'next/link'

export default async function TablesPage() {
  const supabase = await createClient()
  const { data: tables } = await supabase
    .from('venue_tables')
    .select('*')
    .order('label')

  const available = tables?.filter((t) => t.status === 'available').length ?? 0
  const occupied = tables?.filter((t) => t.status === 'occupied').length ?? 0
  const total = tables?.length ?? 0

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Floor View</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">{available} available</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">{occupied} occupied</span>
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: total },
          { label: 'Available', value: available, color: 'text-green-600 dark:text-green-400' },
          { label: 'Occupied', value: occupied, color: 'text-amber-600 dark:text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card px-4 py-3 text-center">
            <p className={`text-2xl font-bold tabular-nums ${color ?? ''}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table grid */}
      {!tables?.length ? (
        <p className="text-muted-foreground text-sm">No tables configured yet. Add them in the admin panel.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {tables.map((table) => {
            const isOccupied = table.status === 'occupied'
            return (
              <Link key={table.id} href={`/tables/${table.id}`}>
                <div
                  className={`
                    relative rounded-xl border-2 p-4 min-h-[110px] flex flex-col justify-between
                    cursor-pointer transition-all active:scale-95
                    ${isOccupied
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50'
                      : 'border-border bg-card hover:bg-accent/60'
                    }
                  `}
                >
                  {/* Status dot */}
                  <div className="flex items-start justify-between">
                    <span
                      className={`text-xl font-bold tracking-tight ${
                        isOccupied ? 'text-amber-700 dark:text-amber-300' : 'text-foreground'
                      }`}
                    >
                      {table.label}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                        isOccupied ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                    />
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between mt-3">
                    <span className={`flex items-center gap-1 text-xs ${
                      isOccupied ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                    }`}>
                      <Users size={11} />
                      {table.capacity}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isOccupied
                          ? 'bg-amber-200 text-amber-800 dark:bg-amber-800/40 dark:text-amber-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {isOccupied ? 'Occupied' : 'Available'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
