// src/components/layout/PageLayout.tsx
//
// The authenticated app shell: sidebar on the left, content on the right.
// Every protected route renders via <Outlet> in the content area.
//
// React Router's <Outlet> pattern means each page component only needs to
// return its own content — not worry about the surrounding chrome.
// This eliminates copy-pasting the Sidebar import into every page file.

import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

export default function PageLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Each page can optionally render its own header via a portal or prop
            drilling — for now the content area takes the full height */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}