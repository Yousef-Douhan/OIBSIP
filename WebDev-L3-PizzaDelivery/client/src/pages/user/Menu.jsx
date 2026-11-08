import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import PizzaPreview from '../../components/PizzaPreview'
import { rupees } from '../../lib/format'

// turn a pizza's default ingredients into a builder selection
const toSelection = (pizza) => {
  const by = (cat) => pizza.defaultIngredients.filter((i) => i.category === cat)
  return {
    base: by('base')[0],
    sauce: by('sauce')[0],
    cheese: by('cheese')[0],
    veggies: by('veggie'),
  }
}

export default function Menu() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pizzas, setPizzas] = useState(null)

  useEffect(() => {
    api
      .get('/pizzas')
      .then(({ data }) => setPizzas(data.pizzas))
      .catch((err) => {
        toast.error(errorMessage(err))
        setPizzas([])
      })
  }, [])

  const customise = (pizza) => {
    const s = toSelection(pizza)
    navigate('/build', {
      state: {
        preset: { base: s.base?._id, sauce: s.sauce?._id, cheese: s.cheese?._id, veggies: s.veggies.map((v) => v._id) },
        from: pizza.name,
      },
    })
  }

  return (
    <div>
      <section className="grid items-center gap-8 rounded-3xl bg-white p-6 sm:p-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-muted">Ciao, {user?.name?.split(' ')[0]}.</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">What goes on your pizza tonight?</h1>
          <p className="mt-4 max-w-lg text-muted">
            Start from one of the house pizzas below or build your own in four steps: base, sauce, cheese, vegetables. You see the price before you pay.
          </p>
          <Link to="/build" className="btn-primary mt-6">Build your own pizza</Link>
        </div>
        <PizzaPreview
          className="mx-auto w-full max-w-xs"
          selection={{
            base: { name: 'Thick Crust' },
            sauce: { name: 'Classic Tomato' },
            cheese: { name: 'Mozzarella' },
            veggies: [{ name: 'Tomato' }, { name: 'Mushroom' }, { name: 'Capsicum' }],
          }}
        />
      </section>

      <h2 className="mt-12 text-2xl">House pizzas</h2>
      <p className="text-muted">Every one can be changed in the builder before you order.</p>

      {!pizzas ? (
        <p className="mt-6 text-muted">Loading the menu…</p>
      ) : pizzas.length === 0 ? (
        <p className="mt-6 text-muted">The menu is empty. Run <code>npm run seed</code> in the server folder to add the house pizzas.</p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pizzas.map((p) => {
            const soldOut = p.defaultIngredients.some((i) => !i.isActive || i.quantity < 1)
            return (
              <li key={p._id} className="panel flex flex-col p-5">
                <PizzaPreview selection={toSelection(p)} className="mx-auto w-40" />
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <h3 className="text-xl">{p.name}</h3>
                  <span className="font-semibold">{rupees(p.basePrice)}</span>
                </div>
                <p className="mt-1 flex-1 text-sm text-muted">{p.description}</p>
                <p className="mt-3 text-xs text-muted">{p.defaultIngredients.map((i) => i.name).join(', ')}</p>
                <button className="btn-secondary mt-4" onClick={() => customise(p)} disabled={soldOut}>
                  {soldOut ? 'An ingredient is sold out' : 'Customise and order'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
