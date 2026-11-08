import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../../api/client'
import useSocket from '../../hooks/useSocket'
import { rupees } from '../../lib/format'

const GROUPS = [
  ['base', 'Pizza bases'],
  ['sauce', 'Sauces'],
  ['cheese', 'Cheese'],
  ['veggie', 'Vegetables'],
]

function Row({ item, onSaved }) {
  const [qty, setQty] = useState(item.quantity)
  const [threshold, setThreshold] = useState(item.threshold)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setQty(item.quantity)
    setThreshold(item.threshold)
  }, [item.quantity, item.threshold])

  const dirty = Number(qty) !== item.quantity || Number(threshold) !== item.threshold
  const low = item.quantity <= item.threshold

  const save = async (patch) => {
    setBusy(true)
    try {
      const { data } = await api.patch(`/admin/inventory/${item._id}`, patch)
      onSaved(data.item)
      toast.success(`${data.item.name} updated`)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <tr className={low ? 'bg-tomato/5' : ''}>
      <td className="py-3 pr-3">
        <span className="font-semibold">{item.name}</span>
        {low && <span className="ml-2 rounded-full bg-tomato px-2 py-0.5 text-xs font-bold text-white">Low</span>}
        {!item.isActive && <span className="ml-2 rounded-full bg-line px-2 py-0.5 text-xs font-bold text-muted">Hidden</span>}
      </td>
      <td className="py-3 pr-3 text-muted">{rupees(item.price)}</td>
      <td className="py-3 pr-3">
        <label className="sr-only" htmlFor={`q-${item._id}`}>Quantity of {item.name}</label>
        <input id={`q-${item._id}`} type="number" min="0" className="input w-24 py-1.5" value={qty} onChange={(e) => setQty(e.target.value)} />
      </td>
      <td className="py-3 pr-3">
        <label className="sr-only" htmlFor={`t-${item._id}`}>Alert threshold for {item.name}</label>
        <input id={`t-${item._id}`} type="number" min="0" className="input w-20 py-1.5" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
      </td>
      <td className="py-3 text-right whitespace-nowrap">
        <button className="btn-quiet text-sm" onClick={() => setQty(Number(qty) + 50)} disabled={busy}>+50</button>
        <button className="btn-secondary py-1.5 text-sm" onClick={() => save({ quantity: Number(qty), threshold: Number(threshold) })} disabled={busy || !dirty}>
          Save
        </button>
        <button className="btn-quiet text-sm" onClick={() => save({ isActive: !item.isActive })} disabled={busy}>
          {item.isActive ? 'Hide' : 'Show'}
        </button>
      </td>
    </tr>
  )
}

export default function AdminInventory() {
  const [items, setItems] = useState(null)

  const load = useCallback(() => {
    api
      .get('/admin/inventory')
      .then(({ data }) => setItems(data.items))
      .catch((err) => toast.error(errorMessage(err)))
  }, [])

  useEffect(load, [load])

  const replace = (item) => setItems((list) => list?.map((i) => (i._id === item._id ? item : i)))

  // stock changes after every paid order
  useSocket({ 'order:new': load, 'inventory:updated': replace })

  if (!items) return <p className="text-muted">Loading inventory…</p>

  const lowCount = items.filter((i) => i.quantity <= i.threshold).length

  return (
    <div>
      <h1 className="text-3xl">Inventory</h1>
      <p className="mt-1 text-muted">
        Each paid order uses one unit of every chosen ingredient. When an item reaches its threshold, the admin gets an email.
      </p>
      {lowCount > 0 && (
        <p className="mt-4 rounded-xl bg-tomato/10 px-4 py-3 font-semibold text-tomato-dark">
          {lowCount} {lowCount === 1 ? 'item is' : 'items are'} at or below the alert threshold. Restock and save to clear the alert.
        </p>
      )}

      <div className="mt-8 space-y-8">
        {GROUPS.map(([cat, title]) => (
          <section key={cat} className="panel overflow-x-auto p-5">
            <h2 className="text-xl">{title}</h2>
            <table className="mt-3 w-full min-w-[640px] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="py-2 font-semibold">Item</th>
                  <th className="py-2 font-semibold">Price</th>
                  <th className="py-2 font-semibold">In stock</th>
                  <th className="py-2 font-semibold">Alert at</th>
                  <th className="py-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.filter((i) => i.category === cat).map((i) => (
                  <Row key={i._id} item={i} onSaved={replace} />
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  )
}
