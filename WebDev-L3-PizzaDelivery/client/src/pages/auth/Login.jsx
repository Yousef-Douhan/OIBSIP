import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import AuthShell, { Field } from '../../components/AuthShell'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setNeedsVerification(false)
    try {
      const { data } = await api.post('/auth/login', form)
      signIn(data.token, data.user)
      toast.success(`Welcome back, ${data.user.name}`)
      navigate(location.state?.from?.pathname || '/menu', { replace: true })
    } catch (err) {
      if (err.response?.data?.needsVerification) setNeedsVerification(true)
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    try {
      const { data } = await api.post('/auth/resend-verification', { email: form.email })
      toast.success(data.message)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <AuthShell
      title="Log in"
      subtitle="Order a pizza or follow the one on its way."
      footer={
        <>
          New here? <Link to="/register" className="font-semibold text-basil underline">Create an account</Link>
          <span className="mx-2">·</span>
          <Link to="/admin/login" className="underline">Kitchen login</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" name="email" type="email" autoComplete="email" required value={form.email} onChange={update} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required value={form.password} onChange={update} />
        <div className="text-right text-sm">
          <Link to="/forgot-password" className="text-basil underline">Forgot password?</Link>
        </div>
        {needsVerification && (
          <p className="rounded-xl bg-crust-soft p-3 text-sm">
            Your email isn&apos;t verified yet. Check your inbox or{' '}
            <button type="button" onClick={resend} className="font-semibold text-basil underline">send a new link</button>.
          </p>
        )}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </AuthShell>
  )
}
