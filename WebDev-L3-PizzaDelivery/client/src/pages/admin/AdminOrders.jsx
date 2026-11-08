import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../../api/client'
import useSocket from '../../hooks/useSocket'
import { STATUSES, rupees, shortId, timeAgo } from '../../lib/format'

const NEXT = {
  received: { status: 'kitchen', label: 'Start cooking' },
  kitchen: { status: 'delivery', label: 'Send for delivery' },
}

export default function AdminOrders() {
  const [orders, setOrders] = useState(null)
  const [moving, setMoving] = useState(null)

  const load = useCallback(() => {
    api
      .get('/admin/orders')
      .then(({ data }) => setOrders(data.orders))
      .catch((err) => toast.error(errorMessage(err)))
  }, [])

  useEffect(load, [load])

  const upsert = (order) =>
    setOrders((list) => {
      if (!list) return list
      const exists = list.some((o) => o._id === order._id)
      return exists ? list.map((o) => (o._id === order._id ? order : o)) : [order, ...list]
    })

  useSocket({
    'order:new': (order) => {
      upsert(order)
      toast(`New order ${shortId(order._id)} from ${order.user?.name}`, { icon: '🍕' })
    },
    'order:updated': upsert,
  })

  const move = async (order) => {
    const next = NEXT[order.status]
    setMoving(order._id)
    try {
      const { data } = await api.patch(`/admin/orders/${order._id}/status`, { status: next.status })
      upsert(data.order)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setMoving(null)
    }
  }

  if (!orders) return <p className="text-muted">Loading orders…</p>

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Kitchen board</h1>
          <p className="mt-1 text-muted">New paid orders appear here instantly. Moving an order updates the customer&apos;s screen.</p>
        </div>
        <button className="btn-quiet" onClick={load}>Refresh</button>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {STATUSES.map((col) => {
          const list = orders.filter((o) => o.status === col.key)
          return (
            <section key={col.key} className="rounded-2xl bg-basil-soft/60 p-4" aria-labelledby={`col-${col.key}`}>
              <h2 id={`col-${col.key}`} className="flex items-baseline justify-between text-lg">
                {col.label}
                <span className="font-sans text-sm font-semibold text-muted">{list.length}</span>
              </h2>

              {list.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No orders here.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {list.map((o) => {
                    const { base, sauce, cheese, veggies = [] } = o.items
                    return (
                      <li key={o._id} className="rounded-xl border border-line bg-white p-4">
                        <div className="flex items-baseline justify-between">
                          <span className="font-semibold">{shortId(o._id)}</span>
                          <span className="text-xs text-muted">{timeAgo(o.createdAt)}</span>
                        </div>
                        <p className="text-sm text-muted">{o.user?.name} · {rupees(o.totalAmount)}</p>
                        <ul className="mt-3 space-y-0.5 text-sm">
                          <li>{base?.name}</li>
                          <li>{sauce?.name}</li>
                          <li>{cheese?.name}</li>
                          {veggies.length > 0 && <li className="text-muted">+ {veggies.map((v) => v.name).join(', ')}</li>}
                        </ul>
                        {NEXT[o.status] && (
                          <button className="btn-secondary mt-4 w-full py-2 text-sm" onClick={() => move(o)} disabled={moving === o._id}>
                            {moving === o._id ? 'Updating…' : NEXT[o.status].label}
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
