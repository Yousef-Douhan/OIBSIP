import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../../api/client'
import AuthShell, { Field } from '../../components/AuthShell'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState(null)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const mismatch = form.confirm && form.password !== form.confirm

  const submit = async (e) => {
    e.preventDefault()
    if (mismatch) return
    setBusy(true)
    try {
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password })
      setSentTo(form.email)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (sentTo) {
    return (
      <AuthShell title="Check your inbox" subtitle={`We sent a verification link to ${sentTo}.`} footer={<Link to="/login" className="font-semibold text-basil underline">Back to log in</Link>}>
        <p className="text-muted">Open the email and click Verify email. The link works for 24 hours. After that you can log in and place your first order.</p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Create an account"
      subtitle="You'll confirm your email before your first order."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-basil underline">Log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" name="name" autoComplete="name" required value={form.name} onChange={update} />
        <Field label="Email" name="email" type="email" autoComplete="email" required value={form.email} onChange={update} />
        <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={6} required value={form.password} onChange={update} />
        <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" required value={form.confirm} onChange={update} error={mismatch ? 'Passwords do not match' : null} />
        <button className="btn-primary w-full" disabled={busy || mismatch}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthShell>
  )
}
