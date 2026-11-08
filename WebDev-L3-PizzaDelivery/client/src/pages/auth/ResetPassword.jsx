import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../../api/client'
import AuthShell, { Field } from '../../components/AuthShell'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const mismatch = confirm && password !== confirm

  const submit = async (e) => {
    e.preventDefault()
    if (mismatch) return
    setBusy(true)
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password })
      toast.success(data.message)
      navigate('/login')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Choose a new password" footer={<Link to="/forgot-password" className="underline">Request a new link</Link>}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field label="Confirm new password" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} error={mismatch ? 'Passwords do not match' : null} />
        <button className="btn-primary w-full" disabled={busy || mismatch}>{busy ? 'Saving…' : 'Save new password'}</button>
      </form>
    </AuthShell>
  )
}
