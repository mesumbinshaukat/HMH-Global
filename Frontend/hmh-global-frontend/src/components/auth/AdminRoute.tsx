import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store'

interface AdminRouteProps {
  children: React.ReactNode
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore()
  console.log('[AdminRoute] user:', user, 'isAuthenticated:', isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated || user?.role !== 'admin') {
    console.log('[AdminRoute] Access denied. Redirecting to /login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  console.log('[AdminRoute] Access granted. Rendering admin content.')
  return <>{children}</>
}

export default AdminRoute
