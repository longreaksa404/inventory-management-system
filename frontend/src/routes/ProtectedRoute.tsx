// src/routes/ProtectedRoute.tsx
//
// Two jobs:
//   1. Wait for auth hydration (the initial getProfile() call on mount)
//      Without this, users on a valid session would flash to /login then back.
//   2. Redirect unauthenticated users to /login.
//
// Uses React Router's <Outlet> pattern so any nested routes render inside here.
// This is why App.tsx wraps all protected routes in a single <ProtectedRoute>
// rather than wrapping each page individually.
//
// Interview talking point: the isLoading check prevents a "flash of unauthenticated
// content" (FOUC) — without it, every page refresh would briefly show the login
// page even for logged-in users.

import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Still checking if the stored token is valid — show a full-page spinner
  // rather than prematurely redirecting to login.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    )
  }

  // Not authenticated — redirect to login, saving the attempted URL so we can
  // redirect back after a successful login (good UX for bookmarked pages).
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Authenticated — render the matched child route.
  return <Outlet />
}