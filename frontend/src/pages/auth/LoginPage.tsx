// src/pages/auth/LoginPage.tsx
//
// Design intent: clean, centered card — professional without being flashy.
// The IMS is an internal business tool, so the login page should feel
// trustworthy and fast, not decorative.
//
// Interview talking points:
// - Zod schema validates before any network call is made (avoids wasted requests)
// - `state.from` redirect: if a user bookmarks /products and logs in,
//   they land back on /products rather than always hitting /dashboard
// - Error handling distinguishes 401 (bad credentials) from network errors

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { authApi } from "@/api/auth"

// ─── Validation schema ────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

// ─── Component ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)

  // Where to go after login — respect redirect-after-login pattern
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard"

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null)
    try {
      const tokens = await authApi.login(values)
      await login(tokens.access, tokens.refresh)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      // Axios errors carry response.status — distinguish 401 from 5xx
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 401) {
        setServerError("Incorrect email or password.")
      } else {
        setServerError("Something went wrong. Please try again.")
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-foreground">
            <span className="text-sm font-bold text-background">IMS</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Inventory Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-card px-6 py-7 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Server-level error */}
            {serverError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="admin@example.com"
                className={[
                  "flex h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none",
                  "placeholder:text-muted-foreground/60",
                  "transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30",
                  errors.email
                    ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                    : "border-input",
                ].join(" ")}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={[
                  "flex h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none",
                  "placeholder:text-muted-foreground/60",
                  "transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30",
                  errors.password
                    ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                    : "border-input",
                ].join(" ")}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={[
                "mt-2 flex h-9 w-full items-center justify-center rounded-lg",
                "bg-foreground text-sm font-medium text-background",
                "transition-opacity hover:opacity-90 active:opacity-80",
                "disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Internal use only. Contact your administrator for access.
        </p>
      </div>
    </div>
  )
}