// src/components/layout/Navbar.tsx
//
// Top bar that sits above every authenticated page.
// Keeps the sidebar focused on navigation — the navbar handles page-level context.
//
// Receives `title` as a prop so each page can set its own heading.
// This is simpler than a global title store for a portfolio project.

interface NavbarProps {
  title?: string
}

export default function Navbar({ title }: NavbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b bg-background px-6">
      <h1 className="text-sm font-semibold text-foreground">
        {title ?? "Dashboard"}
      </h1>
    </header>
  )
}