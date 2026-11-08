import { useEffect, useRef, useState } from 'react'
import { rupees } from '../lib/format'

/* Test-mode payment window.
   For the "mock" provider it mirrors Razorpay's test checkout:
   the customer can complete the payment or simulate a failure. */
export default function CheckoutModal({ amount, onPay, onClose, busy }) {
  const [method, setMethod] = useState('card')
  const payRef = useRef(null)

  useEffect(() => {
    payRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-basil px-6 py-5 text-white">
          <p className="text-sm text-white/75">Basilico · test payment</p>
          <p id="checkout-title" className="font-display text-3xl">{rupees(amount)}</p>
        </div>

        <div className="space-y-4 p-6">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Pay with</legend>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['card', 'Card'],
                ['upi', 'UPI'],
                ['netbanking', 'Netbanking'],
              ].map(([key, label]) => (
                <label key={key} className={`cursor-pointer rounded-xl border px-2 py-2 text-center text-sm font-semibold ${method === key ? 'border-basil bg-basil-soft text-basil' : 'border-line text-muted'}`}>
                  <input type="radio" name="method" value={key} checked={method === key} onChange={() => setMethod(key)} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <p className="rounded-xl bg-crust-soft px-3 py-2 text-sm text-ink">
            Test mode. No money is charged. Razorpay sign-up needs an Indian PAN, so this window simulates its test checkout with the same verification steps.
          </p>

          <button ref={payRef} className="btn-primary w-full" onClick={() => onPay('success')} disabled={busy}>
            {busy ? 'Processing…' : `Pay ${rupees(amount)}`}
          </button>
          <div className="flex justify-between">
            <button className="btn-quiet" onClick={() => onPay('failure')} disabled={busy}>Simulate failed payment</button>
            <button className="btn-quiet" onClick={onClose} disabled={busy}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
