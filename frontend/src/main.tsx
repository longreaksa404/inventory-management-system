// src/main.tsx
//
// Provider nesting order matters:
//   QueryClientProvider  — must wrap everything so React Query cache is global
//     BrowserRouter      — must wrap AuthProvider so auth can use navigate()
//       AuthProvider     — must wrap App so every route can read auth state
//         App            — route definitions

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/stores/authStore"
import App from "./App"
import "./index.css"

// React Query client config:
// - staleTime 60s: don't refetch data that was fetched less than a minute ago
//   (prevents waterfalls when navigating between pages that share data)
// - retry 1: fail fast on auth errors (don't retry 401s three times)
// - refetchOnWindowFocus false: avoids surprising refetches during demos
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const root = document.getElementById("root")
if (!root) throw new Error("Root element not found")

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)