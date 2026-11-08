import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../../api/client'
import PizzaPreview from '../../components/PizzaPreview'
import CheckoutModal from '../../components/CheckoutModal'
import { rupees } from '../../lib/format'

const STEPS = [
  { key: 'base', title: 'Choose your base', help: 'Pick one of five crusts.', multi: false },
  { key: 'sauce', title: 'Choose your sauce', help: 'Pick one of five sauces.', multi: false },
  { key: 'cheese', title: 'Choose your cheese', help: 'Pick one cheese.', multi: false },
  { key: 'veggie', title: 'Add vegetables', help: 'Pick as many as you like, or none.', multi: true },
  { key: 'summary', title: 'Check your order', help: 'Review the price, then pay.' },
]

const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = resolve
    s.onerror = () => reject(new Error('Could not load Razorpay checkout'))
    document.body.appendChild(s)
  })

export default function Builder() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [options, setOptions] = useState(null)
  const [step, setStep] = useState(0)
  const [sel, setSel] = useState({ base: null, sauce: null, cheese: null, veggie: [] })
  const [quote, setQuote] = useState(null)
  const [checkout, setCheckout] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .get('/inventory/options')
      .then(({ data }) => {
        setOptions(data.options)
        const p = state?.preset
        if (p) {
          const ok = (cat, id) => data.options[cat].some((o) => o.id === id && o.available)
          setSel({
            base: ok('base', p.base) ? p.base : null,
            sauce: ok('sauce', p.sauce) ? p.sauce : null,
            cheese: ok('cheese', p.cheese) ? p.cheese : null,
            veggie: (p.veggies || []).filter((id) => ok('veggie', id)),
          })
        }
      })
      .catch((err) => toast.error(errorMessage(err)))
  }, [state])

  const find = (cat, id) => options?.[cat].find((o) => o.id === id)
  const selection = useMemo(
    () => ({
      base: find('base', sel.base),
      sauce: find('sauce', sel.sauce),
      cheese: find('cheese', sel.cheese),
      veggies: sel.veggie.map((id) => find('veggie', id)).filter(Boolean),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sel, options],
  )

  const items = { base: sel.base, sauce: sel.sauce, cheese: sel.cheese, veggies: sel.veggie }
  const runningTotal = [selection.base, selection.sauce, selection.cheese, ...selection.veggies]
    .filter(Boolean)
    .reduce((s, i) => s + i.price, 0)

  const current = STEPS[step]
  const canContinue = current.key === 'veggie' || current.key === 'summary' || Boolean(sel[current.key])

  // The summary price comes from the server, not from the browser
  useEffect(() => {
    if (current.key !== 'summary') return
    setQuote(null)
    api
      .post('/orders/quote', { items })
      .then(({ data }) => setQuote(data))
      .catch((err) => {
        toast.error(errorMessage(err))
        setStep(0)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const pick = (cat, id) => {
    if (cat === 'veggie') {
      setSel((s) => ({ ...s, veggie: s.veggie.includes(id) ? s.veggie.filter((v) => v !== id) : [...s.veggie, id] }))
    } else {
      setSel((s) => ({ ...s, [cat]: id }))
    }
  }

  const finish = async (gatewayOrderId, paymentId, signature) => {
    const { data } = await api.post('/orders/verify', { gatewayOrderId, paymentId, signature })
    toast.success('Payment received. Your pizza is on the kitchen board.')
    navigate('/orders', { state: { highlight: data.order._id } })
  }

  const startCheckout = async () => {
    setBusy(true)
    try {
      const { data } = await api.post('/orders/checkout', { items })
      if (data.gateway.provider === 'razorpay') {
        await loadRazorpay()
        const rzp = new window.Razorpay({
          key: data.gateway.keyId,
          amount: data.gateway.amount,
          currency: data.gateway.currency,
          name: 'Basilico',
          description: 'Custom pizza',
          order_id: data.gateway.orderId,
          prefill: { name: data.user.name, email: data.user.email },
          theme: { color: '#1e4d2b' },
          handler: (r) =>
            finish(r.razorpay_order_id, r.razorpay_payment_id, r.razorpay_signature).catch((err) => toast.error(errorMessage(err))),
        })
        rzp.on('payment.failed', () => toast.error('Payment failed. Nothing was charged; you can try again.'))
        rzp.open()
      } else {
        setCheckout(data.gateway)
      }
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const payMock = async (outcome) => {
    setBusy(true)
    try {
      const { data } = await api.post('/orders/mock-pay', { gatewayOrderId: checkout.orderId, outcome })
      await finish(checkout.orderId, data.paymentId, data.signature)
    } catch (err) {
      if (err.response?.data?.code === 'PAYMENT_FAILED') {
        toast.error('Payment failed. Nothing was charged; you can try again.')
      } else {
        toast.error(errorMessage(err))
      }
      setCheckout(null)
    } finally {
      setBusy(false)
    }
  }

  if (!options) return <p className="text-muted">Loading ingredients…</p>

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section>
        {state?.from && step === 0 && <p className="mb-2 text-sm text-muted">Starting from the {state.from}. Change anything you like.</p>}

        <ol className="mb-6 flex flex-wrap gap-2" aria-label="Builder steps">
          {STEPS.map((s, i) => (
            <li key={s.key}>
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                aria-current={i === step ? 'step' : undefined}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  i === step ? 'bg-basil text-white' : i < step ? 'bg-basil-soft text-basil hover:bg-basil/15' : 'bg-white text-muted'
                }`}
              >
                {i + 1}. {s.key === 'veggie' ? 'Vegetables' : s.key[0].toUpperCase() + s.key.slice(1)}
              </button>
            </li>
          ))}
        </ol>

        <h1 className="text-3xl">{current.title}</h1>
        <p className="mt-1 text-muted">{current.help}</p>

        {current.key !== 'summary' ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2" role={current.multi ? 'group' : 'radiogroup'}>
            {options[current.key].map((o) => {
              const chosen = current.multi ? sel.veggie.includes(o.id) : sel[current.key] === o.id
              return (
                <button
                  key={o.id}
                  role={current.multi ? 'checkbox' : 'radio'}
                  aria-checked={chosen}
                  disabled={!o.available}
                  onClick={() => pick(current.key, o.id)}
                  className={`flex items-center justify-between rounded-2xl border-2 bg-white px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    chosen ? 'border-crust bg-crust-soft' : 'border-transparent hover:border-line'
                  }`}
                >
                  <span>
                    <span className="block font-semibold">{o.name}</span>
                    <span className="text-sm text-muted">{o.available ? rupees(o.price) : 'Sold out'}</span>
                  </span>
                  <span aria-hidden="true" className={`grid h-6 w-6 place-items-center rounded-full border-2 text-xs font-bold ${chosen ? 'border-basil bg-basil text-white' : 'border-line'}`}>
                    {chosen ? '✓' : ''}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="panel mt-6 p-6">
            {!quote ? (
              <p className="text-muted">Calculating your price…</p>
            ) : (
              <>
                <ul className="divide-y divide-line">
                  {quote.lines.map((l) => (
                    <li key={l.id} className="flex justify-between py-2">
                      <span><span className="text-muted capitalize">{l.category}:</span> {l.name}</span>
                      <span>{rupees(l.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-baseline justify-between border-t-2 border-ink pt-4">
                  <span className="font-semibold">Total</span>
                  <span className="font-display text-3xl text-basil">{rupees(quote.total)}</span>
                </div>
                <button className="btn-primary mt-6 w-full" onClick={startCheckout} disabled={busy}>
                  {busy ? 'Opening payment…' : `Pay ${rupees(quote.total)}`}
                </button>
              </>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button className="btn-quiet" onClick={() => setStep(step - 1)} disabled={step === 0}>Back</button>
          {current.key !== 'summary' && (
            <button className="btn-secondary" onClick={() => setStep(step + 1)} disabled={!canContinue}>
              {step === 3 ? 'Review order' : 'Continue'}
            </button>
          )}
        </div>
      </section>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="panel p-6">
          <PizzaPreview selection={selection} className="mx-auto w-full max-w-[300px]" />
          <dl className="mt-5 space-y-1 text-sm">
            {[
              ['Base', selection.base?.name],
              ['Sauce', selection.sauce?.name],
              ['Cheese', selection.cheese?.name],
              ['Vegetables', selection.veggies.map((v) => v.name).join(', ') || null],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-medium">{v || '—'}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 flex justify-between border-t border-line pt-4 font-semibold">
            <span>So far</span>
            <span>{rupees(runningTotal)}</span>
          </p>
        </div>
      </aside>

      {checkout && <CheckoutModal amount={checkout.amount / 100} busy={busy} onPay={payMock} onClose={() => setCheckout(null)} />}
    </div>
  )
}
