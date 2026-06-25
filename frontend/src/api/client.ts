// src/api/client.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"

// ─── Token helpers ───────────────────────────────────────────────────────────
// Stored in localStorage so the session survives page refresh.
// Never store tokens in memory-only for a portfolio project — the UX of
// being logged out on every refresh is worse than the marginal security gain.

export const tokenStorage = {
  getAccess: () => localStorage.getItem("access_token"),
  getRefresh: () => localStorage.getItem("refresh_token"),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem("access_token", access)
    localStorage.setItem("refresh_token", refresh)
  },
  clear: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
  },
}

// ─── Axios instance ───────────────────────────────────────────────────────────
// All API calls go through this instance so interceptors apply everywhere.

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
})

// ─── Request interceptor ─────────────────────────────────────────────────────
// Attaches the access token to every outgoing request automatically.
// Without this, every API call would need to manually set the Authorization header.

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccess()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response interceptor ────────────────────────────────────────────────────
// Handles token expiry transparently:
//   1. Request fails with 401
//   2. We try to get a new access token using the refresh token
//   3. If refresh succeeds → retry the original request with the new token
//   4. If refresh fails → clear tokens and redirect to login
//
// This means the user never sees a 401 error — they only get redirected to
// login when their refresh token has also expired (after 7 days).

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: AxiosError) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token!)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // If a refresh is already in flight, queue this request until it resolves
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = tokenStorage.getRefresh()

    if (!refreshToken) {
      tokenStorage.clear()
      window.location.href = "/login"
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/api/v1/accounts/refresh/`, {
        refresh: refreshToken,
      })

      const newAccess: string = data.access
      tokenStorage.setTokens(newAccess, refreshToken)
      processQueue(null, newAccess)

      originalRequest.headers.Authorization = `Bearer ${newAccess}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null)
      tokenStorage.clear()
      window.location.href = "/login"
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)