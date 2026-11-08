import { STATUSES } from '../lib/format'

/* The three kitchen stages, with the current one highlighted */
export default function StatusTracker({ status, history = [] }) {
  const current = STATUSES.findIndex((s) => s.key === status)
  const timeOf = (key) => {
    const h = history.find((x) => x.status === key)
    return h ? new Date(h.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null
  }

  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Order progress">
      {STATUSES.map((s, i) => {
        const done = i <= current
        const active = i === current
        return (
          <li key={s.key} aria-current={active ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full transition-colors duration-500 ${done ? 'bg-basil' : 'bg-line'}`} />
            <p className={`mt-2 text-sm font-semibold ${done ? 'text-basil' : 'text-muted'}`}>{s.label}</p>
            <p className="text-xs text-muted">{timeOf(s.key) || (active ? s.hint : '')}</p>
          </li>
        )
      })}
    </ol>
  )
}
