import { Link } from 'react-router-dom'
import PizzaPreview from './PizzaPreview'

const SHOWCASE = {
  base: { name: 'Thin Crust' },
  sauce: { name: 'Classic Tomato' },
  cheese: { name: 'Mozzarella' },
  veggies: [{ name: 'Mushroom' }, { name: 'Olives' }, { name: 'Capsicum' }, { name: 'Onion' }],
}

/* Split layout for every login / signup screen.
   tone="kitchen" switches the side panel for the admin login. */
export default function AuthShell({ title, subtitle, children, footer, tone = 'customer' }) {
  const kitchen = tone === 'kitchen'
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className={`relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 ${kitchen ? 'bg-ink text-white' : 'bg-basil text-white'}`}>
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="h-9 w-9" />
          <span className="font-display text-2xl">Basilico</span>
        </Link>

        <div className="relative z-10 max-w-sm pb-40 xl:pb-0">
          <p className="font-display text-4xl leading-tight text-white">
            {kitchen ? 'Every ticket, every topping, one screen.' : 'Your pizza, built one layer at a time.'}
          </p>
          <p className="mt-4 text-white/75">
            {kitchen
              ? 'Move orders through the kitchen and keep the shelves stocked before anything runs out.'
              : 'Pick a base, a sauce, a cheese and your vegetables, pay online, and watch it leave the oven.'}
          </p>
        </div>

        <PizzaPreview selection={SHOWCASE} className="pointer-events-none absolute -bottom-32 -right-32 w-[24rem] opacity-90" />
      </aside>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="font-display text-xl text-basil">Basilico</span>
          </Link>
          <h1 className="text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-sm text-muted">{footer}</div>}
        </div>
      </section>
    </div>
  )
}

export function Field({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <input className="input" {...props} />
      {error && <span className="mt-1 block text-sm text-tomato">{error}</span>}
    </label>
  )
}
