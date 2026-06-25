// src/stores/authStore.ts
//
// Auth state lives here. Single source of truth for:
//   - Whether the user is authenticated
//   - The decoded user object (role, name, email)
//   - Login / logout actions
//
// Why Context + useReducer instead of Zustand?
//   - No extra dependency for a simple auth state machine
//   - useReducer makes state transitions explicit and testable
//   - For server data (products, orders) we use React Query — auth is the
//     only truly global client state, so the overhead of Zustand isn't worth it
//
// Interview talking point: separating "auth state" (who am I?) from "server
// state" (what data does the API have?) is a deliberate architectural decision.
// React Query owns server state; this store owns identity state only.

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react"
import { tokenStorage } from "@/api/client"
import { authApi } from "@/api/auth"
import type { User } from "@/types"

// ─── State shape ─────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean // true only during initial token hydration on mount
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type AuthAction =
  | { type: "AUTH_LOADING" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_FAILURE" }
  | { type: "LOGOUT" }

// ─── Reducer ─────────────────────────────────────────────────────────────────

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_LOADING":
      return { ...state, isLoading: true }

    case "AUTH_SUCCESS":
      return {
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      }

    case "AUTH_FAILURE":
    case "LOGOUT":
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }

    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  login: (accessToken: string, refreshToken: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

const INITIAL_STATE: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // starts true so the app waits for hydration before rendering
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, INITIAL_STATE)

  // On mount: if an access token exists in localStorage, fetch the user profile
  // to verify the token is still valid and hydrate the user object.
  // This is the "stay logged in after page refresh" mechanism.
  useEffect(() => {
    const token = tokenStorage.getAccess()

    if (!token) {
      dispatch({ type: "AUTH_FAILURE" })
      return
    }

    authApi
      .getProfile()
      .then((user) => dispatch({ type: "AUTH_SUCCESS", payload: user }))
      .catch(() => {
        // Token in storage is expired or invalid — clear it so the user
        // gets sent to login rather than stuck in an auth loop.
        tokenStorage.clear()
        dispatch({ type: "AUTH_FAILURE" })
      })
  }, [])

  const login = async (accessToken: string, refreshToken: string) => {
    tokenStorage.setTokens(accessToken, refreshToken)
    const user = await authApi.getProfile()
    dispatch({ type: "AUTH_SUCCESS", payload: user })
  }

  const logout = () => {
    tokenStorage.clear()
    dispatch({ type: "LOGOUT" })
  }

  return AuthContext.Provider({ value: { ...state, login, logout }, children })
}

// ─── Hook ────────────────────────────────────────────────────────────────────

// Not exported directly — consumers use useAuth() from hooks/useAuth.ts.
// Keeping the raw context internal prevents accidental misuse of the context
// object (e.g. forgetting the null check).
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuthContext must be used inside <AuthProvider>")
  }
  return ctx
}