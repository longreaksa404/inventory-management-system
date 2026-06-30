// src/components/layout/Sidebar.tsx
//
// Design: dark sidebar (#0f1117) with subtle active state — professional,
// high-contrast, matches the "internal tool" aesthetic without being generic.
//
// Role-based rendering: admin sees everything, staff only sees operational pages.
// The nav items array drives this — adding a new page means adding one item here.
//
// Interview talking point: the `allowedRoles` pattern means the sidebar is the
// single source of truth for what each role can see. No duplication across files.

import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import type { UserRole } from "@/types"
import {
  LayoutDashboard,
  Package,
  Tag,
  Warehouse,
  Truck,
  ShoppingCart,
  Receipt,
  ArrowDownUp,
  AlertTriangle,
  BarChart2,
  LogOut,
} from "lucide-react"
import { UserCircle } from "lucide-react"


// ─── Nav item definition ──────────────────────────────────────────────────────

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  allowedRoles?: UserRole[] // undefined = all roles can see it
}

interface NavGroup {
  group: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Inventory",
    items: [
      { label: "Products", path: "/products", icon: Package },
      { label: "Categories", path: "/categories", icon: Tag },
      { label: "Stock Transactions", path: "/stock", icon: ArrowDownUp },
      { label: "Low Stock Alerts", path: "/alerts", icon: AlertTriangle },
    ],
  },
  {
    group: "Operations",
    items: [
      { label: "Warehouses", path: "/warehouses", icon: Warehouse },
      { label: "Suppliers", path: "/suppliers", icon: Truck },
      { label: "Customers", path: "/customers", icon: UserCircle },
      { label: "Purchase Orders", path: "/orders/purchase", icon: ShoppingCart },
      { label: "Sale Orders", path: "/orders/sales", icon: Receipt },
    ],
  },
  {
    group: "Analytics",
    items: [
      {
        label: "Reports",
        path: "/reports",
        icon: BarChart2,
        allowedRoles: ["admin", "manager"],
      },
    ],
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const canSee = (item: NavItem) => {
    if (!item.allowedRoles) return true
    if (!user) return false
    return item.allowedRoles.includes(user.role)
  }

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border/50 bg-[#0f1117] text-white">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-4">
        <img
          src="/favicon.svg"
          alt="IMS"
          className="h-7 w-7 shrink-0"
        />
        <span className="text-sm font-semibold tracking-tight text-white">
          Inventory
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(canSee)
          if (visibleItems.length === 0) return null

          return (
            <div key={group.group} className="mb-4">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                {group.group}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white/90",
                        ].join(" ")
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-2.5 px-1">
          {/* Avatar initial */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold uppercase">
            {user?.first_name?.[0] ?? user?.username?.[0] ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white/90">
              {user?.first_name
                ? `${user.first_name} ${user.last_name}`
                : user?.username}
            </p>
            <p className="truncate text-[10px] capitalize text-white/40">
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}