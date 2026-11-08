export const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export const STATUSES = [
  { key: 'received', label: 'Order received', hint: 'The kitchen has your ticket' },
  { key: 'kitchen', label: 'In the kitchen', hint: 'Your pizza is in the oven' },
  { key: 'delivery', label: 'Sent to delivery', hint: 'On its way to you' },
]

export const statusLabel = (key) => STATUSES.find((s) => s.key === key)?.label || key

export const shortId = (id) => `#${String(id).slice(-6).toUpperCase()}`

export const timeAgo = (date) => {
  const s = Math.round((Date.now() - new Date(date)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
