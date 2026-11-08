/* Draws the pizza from the current selection.
   selection = { base, sauce, cheese, veggies: [] } where each item has at least { name }.
   Every layer is optional, so the drawing grows as the customer picks each step. */

const BASES = {
  'Thin Crust': { crust: '#E9B46E', edge: 10, dough: '#F3D7A6' },
  'Thick Crust': { crust: '#D9974F', edge: 20, dough: '#EDC88C' },
  'Cheese Burst': { crust: '#E0A04F', edge: 18, dough: '#F6DC98', ring: '#FFE7A3' },
  'Whole Wheat': { crust: '#B57A43', edge: 14, dough: '#D8AE7C' },
  'Gluten Free': { crust: '#E6C08A', edge: 12, dough: '#F4E2C2' },
}
const SAUCES = {
  'Classic Tomato': '#C8321F',
  'Spicy Arrabbiata': '#A9200F',
  Pesto: '#4E7D2E',
  BBQ: '#6B2E14',
  'White Garlic': '#F1E9D6',
}
const CHEESES = {
  Mozzarella: '#FFF7E3',
  Cheddar: '#F6B73C',
  Parmesan: '#F3E2AE',
  'Vegan Cheese': '#FCEFC9',
}

const VEGGIE_SHAPES = {
  Onion: (x, y, r) => <circle cx={x} cy={y} r={7} fill="none" stroke="#B66FA6" strokeWidth="2.5" transform={`rotate(${r} ${x} ${y})`} />,
  Capsicum: (x, y, r) => <path d={`M${x - 8} ${y} q8 -10 16 0`} fill="none" stroke="#2F8A3A" strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${r} ${x} ${y})`} />,
  Mushroom: (x, y, r) => (
    <g transform={`rotate(${r} ${x} ${y})`}>
      <path d={`M${x - 8} ${y} a8 7 0 0 1 16 0z`} fill="#C9A98A" />
      <rect x={x - 3} y={y} width="6" height="6" rx="2" fill="#E5D3BE" />
    </g>
  ),
  Olives: (x, y) => <circle cx={x} cy={y} r={5} fill="none" stroke="#2A2622" strokeWidth="3" />,
  'Sweet Corn': (x, y) => <circle cx={x} cy={y} r={3.5} fill="#F7C531" />,
  Jalapeno: (x, y) => (
    <g>
      <circle cx={x} cy={y} r={6} fill="#5E9B2E" />
      <circle cx={x} cy={y} r={2.5} fill="#D6E9A8" />
    </g>
  ),
  Tomato: (x, y) => (
    <g>
      <circle cx={x} cy={y} r={8} fill="#E0442E" />
      <circle cx={x} cy={y} r={4} fill="#F28A6B" />
    </g>
  ),
}

// deterministic pseudo-random so toppings don't jump around on every render
const rand = (seed) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}
const scatter = (key, count, radius) => {
  const seed = [...key].reduce((s, c) => s + c.charCodeAt(0), 0)
  return Array.from({ length: count }, (_, i) => {
    const a = rand(seed + i * 7.1) * Math.PI * 2
    const d = Math.sqrt(rand(seed + i * 3.3)) * radius
    return { x: 120 + Math.cos(a) * d, y: 120 + Math.sin(a) * d, r: Math.round(rand(seed + i) * 360) }
  })
}

export default function PizzaPreview({ selection = {}, className = '' }) {
  const base = BASES[selection.base?.name]
  const sauce = SAUCES[selection.sauce?.name]
  const cheese = CHEESES[selection.cheese?.name]
  const veggies = selection.veggies || []
  const inner = 108 - (base?.edge ?? 12)

  const label = [selection.base, selection.sauce, selection.cheese, ...veggies]
    .filter(Boolean)
    .map((i) => i.name)
    .join(', ')

  return (
    <svg viewBox="0 0 240 240" className={className} role="img" aria-label={label ? `Pizza with ${label}` : 'Empty pizza board'}>
      {/* wooden board */}
      <circle cx="120" cy="120" r="118" fill="#C99B6A" />
      <circle cx="120" cy="120" r="112" fill="#D6AB7C" />

      {base ? (
        <>
          <circle cx="120" cy="120" r="108" fill={base.crust} style={{ transition: 'fill .3s' }} />
          {base.ring && <circle cx="120" cy="120" r={108 - base.edge / 2} fill="none" stroke={base.ring} strokeWidth="4" strokeDasharray="6 5" />}
          <circle cx="120" cy="120" r={inner} fill={base.dough} />
        </>
      ) : (
        <circle cx="120" cy="120" r="100" fill="none" stroke="#B88A5B" strokeWidth="2" strokeDasharray="6 6" />
      )}

      {sauce && <circle cx="120" cy="120" r={inner - 6} fill={sauce} opacity="0.95" />}

      {cheese &&
        scatter(selection.cheese.name, 16, inner - 24).map((p, i) => (
          <ellipse key={i} cx={p.x} cy={p.y} rx={13 + (i % 3) * 3} ry={10 + (i % 2) * 3} fill={cheese} opacity="0.92" transform={`rotate(${p.r} ${p.x} ${p.y})`} />
        ))}

      {veggies.map((v) => {
        const draw = VEGGIE_SHAPES[v.name]
        if (!draw) return null
        return <g key={v.name}>{scatter(v.name, 7, inner - 16).map((p, i) => <g key={i}>{draw(p.x, p.y, p.r)}</g>)}</g>
      })}
    </svg>
  )
}
