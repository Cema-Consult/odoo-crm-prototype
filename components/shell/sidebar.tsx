"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Kanban, ListChecks, Users, Phone, Sparkles } from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/overview", label: "Overview", Icon: Home },
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", Icon: Kanban },
  { href: "/opportunities", label: "Opportunities", Icon: ListChecks },
  { href: "/contacts", label: "Contacts", Icon: Users },
  { href: "/activities", label: "Activities", Icon: Phone },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-[240px] shrink-0 bg-surface border-r border-border flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-border">
        <Sparkles className="h-5 w-5 text-accent" />
        <span className="font-semibold">CRM Studio</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={clsx(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
              active ? "bg-surface-muted text-text" : "text-text-muted hover:text-text hover:bg-surface-muted/50"
            )}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
