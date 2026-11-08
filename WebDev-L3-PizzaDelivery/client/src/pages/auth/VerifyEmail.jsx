import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { errorMessage } from '../../api/client'
import AuthShell from '../../components/AuthShell'

export default function VerifyEmail() {
  const { token } = useParams()
  const [state, setState] = useState({ status: 'loading', message: 'Confirming your email…' })
  const called = useRef(false) // the link works once, so avoid a double call in StrictMode

  useEffect(() => {
    if (called.current) return
    called.current = true
    api
      .get(`/auth/verify/${token}`)
      .then(({ data }) => setState({ status: 'ok', message: data.message }))
      .catch((err) => setState({ status: 'error', message: errorMessage(err) }))
  }, [token])

  const title = { loading: 'Verifying…', ok: 'Email verified', error: 'Link not valid' }[state.status]

  return (
    <AuthShell title={title} subtitle={state.message}>
      {state.status === 'ok' && <Link to="/login" className="btn-primary w-full">Log in</Link>}
      {state.status === 'error' && (
        <p className="text-muted">
          The link may have expired or been used already. Try logging in: if your email still needs confirming, you can request a new link there.{' '}
          <Link to="/login" className="font-semibold text-basil underline">Go to log in</Link>
        </p>
      )}
    </AuthShell>
  )
}
