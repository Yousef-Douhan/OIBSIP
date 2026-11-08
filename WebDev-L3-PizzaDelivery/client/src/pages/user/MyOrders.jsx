import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../../api/client'
import useSocket from '../../hooks/useSocket'
import PizzaPreview from '../../components/PizzaPreview'
import StatusTracker from '../../components/StatusTracker'
import { rupees, shortId, statusLabel, timeAgo } from '../../lib/format'

export default function MyOrders() {
  const { state } = useLocation()
  const [orders, setOrders] = useState(null)

  useEffect(() => {
    api
      .get('/orders/my')
      .then(({ data }) => setOrders(data.orders))
      .catch((err) => {
        toast.error(errorMessage(err))
        setOrders([])
      })
  }, [])

  // Live updates pushed by the kitchen
  useSocket({
    'order:status': ({ orderId, status, statusHistory }) => {
      setOrders((list) => list?.map((o) => (o._id === orderId ? { ...o, status, statusHistory } : o)))
      toast.success(`Order ${shortId(orderId)}: ${statusLabel(status)}`)
    },
  })

  if (!orders) return <p className="text-muted">Loading your orders…</p>

  return (
    <div>
      <h1 className="text-3xl">My orders</h1>
      <p className="mt-1 text-muted">This page updates by itself when the kitchen moves your order.</p>

      {orders.length === 0 ? (
        <div className="panel mt-8 p-8 text-center">
          <p className="text-muted">You haven&apos;t ordered yet.</p>
          <Link to="/build" className="btn-primary mt-4">Build your first pizza</Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-5">
          {orders.map((o) => {
            const { base, sauce, cheese, veggies = [] } = o.items
            return (
              <li key={o._id} className={`panel grid gap-6 p-5 sm:grid-cols-[120px_1fr] ${state?.highlight === o._id ? 'ring-2 ring-crust' : ''}`}>
                <PizzaPreview selection={{ base, sauce, cheese, veggies }} className="mx-auto w-28" />
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-xl">Order {shortId(o._id)}</h2>
                    <span className="text-sm text-muted">{timeAgo(o.createdAt)} · {rupees(o.totalAmount)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {[base?.name, sauce?.name, cheese?.name, ...veggies.map((v) => v.name)].filter(Boolean).join(', ')}
                  </p>
                  <div className="mt-5">
                    <StatusTracker status={o.status} history={o.statusHistory} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
