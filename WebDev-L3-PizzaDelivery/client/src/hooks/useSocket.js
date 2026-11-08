import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

/* Subscribes to server events for the logged-in user.
   handlers = { 'order:status': fn, 'order:new': fn, ... } */
export default function useSocket(handlers) {
  const { token } = useAuth()
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    if (!token) return
    const socket = io({ auth: { token } })
    const events = Object.keys(handlersRef.current)
    events.forEach((event) => socket.on(event, (data) => handlersRef.current[event]?.(data)))
    return () => socket.disconnect()
  }, [token])
}
