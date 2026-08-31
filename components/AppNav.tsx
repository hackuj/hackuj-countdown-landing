"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

type IconName = Parameters<typeof Icon>[0]["name"];
export type AppNavItem = { label: string; href: string; icon: IconName };

export function AppNav({ items, mobile = false }: { items: AppNavItem[]; mobile?: boolean }) {
  const pathname = usePathname();
  return <nav className={mobile ? "mobile-app-nav" : "sidebar-nav"} aria-label={mobile ? "App navigation" : "Workspace navigation"}>
    {items.map(item => {
      const active = pathname === item.href
        || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
        || (item.href === "/rooms" && pathname.startsWith("/room/"));
      return <Link key={item.href} href={item.href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
        <Icon name={item.icon}/><span>{item.label}</span>
      </Link>;
    })}
  </nav>;
}
