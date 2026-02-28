import { Navigate } from 'react-router-dom'
import type { JSX } from 'react'
import { useAuth } from '../features/Authentication/auth.context'
import UnauthorizedPage from './UnauthorizedPage'

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireGuest = false,
  allowedRoles = [],
}: {
  children: JSX.Element
  requireAdmin?: boolean
  requireGuest?: boolean
  allowedRoles?: string[]
}) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return null // or a full-page loader
  }

  // If requireGuest is true and user is logged in → redirect to home
  if (requireGuest && user) {
    return <Navigate to='/' replace />
  }

  // If user is not logged in and not a guest route → redirect to login
  if (!user && !requireGuest) {
    return <Navigate to='/login' replace />
  }

  // If admin is required but user is not admin → redirect to home
  if (requireAdmin && role !== 'admin') {
    return <Navigate to='/' replace />
  }

  // Role based access
  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role.toLowerCase())) {
     return <UnauthorizedPage />
  }

  return children
}
