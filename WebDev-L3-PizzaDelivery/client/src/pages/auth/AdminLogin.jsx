import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import AuthShell, { Field } from '../../components/AuthShell'

export default function AdminLogin() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const { data } = await api.post('/admin/login', form)
      signIn(data.token, data.user)
      navigate('/admin/orders', { replace: true })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell tone="kitchen" title="Kitchen login" subtitle="For restaurant staff only." footer={<Link to="/login" className="underline">Customer login</Link>}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Admin email" name="email" type="email" autoComplete="username" required value={form.email} onChange={update} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required value={form.password} onChange={update} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Open the kitchen'}</button>
      </form>
    </AuthShell>
  )
}
