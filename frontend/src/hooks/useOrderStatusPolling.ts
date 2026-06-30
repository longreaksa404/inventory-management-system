// src/hooks/useOrderStatusPolling.ts
//
// Ship (SaleOrder) and Receive (PurchaseOrder) actions return 202 Accepted —
// the actual status change happens asynchronously via Celery. A single
// invalidateQueries() right after the 202 response often fires before the
// task finishes, so the table doesn't reflect the real status.
//
// This hook polls the single-order endpoint every 2s for up to ~15s, or
// until the order's status differs from the status it had when polling
// started. On change (or timeout) it invalidates the list query so the
// table refreshes with the latest data.
//
// Usage:
//   const { pollingIds, startPolling } = useOrderStatusPolling(
//     ordersApi.getPurchaseOrder,
//     ["purchase-orders"]
//   )
//   // in mutation onSuccess(_data, id) => startPolling(id, "confirmed")
//   // in row render: pollingIds.has(order.id) ? <Spinner /> : <ActionButton />

import { useCallback, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

interface PollableOrder {
  status: string
}

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 15000

export function useOrderStatusPolling<T extends PollableOrder>(
  fetchOrder: (id: number) => Promise<T>,
  listQueryKey: unknown[]
) {
  const queryClient = useQueryClient()
  const [pollingIds, setPollingIds] = useState<Set<number>>(new Set())
  const timers = useRef<Map<number, number>>(new Map())

  const stopPolling = useCallback(
    (id: number) => {
      const timer = timers.current.get(id)
      if (timer) {
        window.clearTimeout(timer)
        timers.current.delete(id)
      }
      setPollingIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      queryClient.invalidateQueries({ queryKey: listQueryKey })
    },
    [queryClient, listQueryKey]
  )

  const startPolling = useCallback(
    (id: number, initialStatus: string) => {
      setPollingIds((prev) => new Set(prev).add(id))

      const startedAt = Date.now()

      const tick = async () => {
        if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
          stopPolling(id)
          return
        }
        try {
          const order = await fetchOrder(id)
          if (order.status !== initialStatus) {
            stopPolling(id)
            return
          }
        } catch {
          // Transient network/auth blip — keep polling rather than aborting,
          // the timeout above is the real backstop.
        }
        const timer = window.setTimeout(tick, POLL_INTERVAL_MS)
        timers.current.set(id, timer)
      }

      const timer = window.setTimeout(tick, POLL_INTERVAL_MS)
      timers.current.set(id, timer)
    },
    [fetchOrder, stopPolling]
  )

  return { pollingIds, startPolling }
}