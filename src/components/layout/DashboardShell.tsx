import Link from "next/link";
import { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { LogoutButton } from "@/components/layout/LogoutButton";
import type { SessionUser } from "@/lib/session";

export type NavItem = {
  href: string;
  label: string;
};

export function DashboardShell({
  user,
  navItems,
  children,
}: {
  user: SessionUser;
  navItems: NavItem[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#f7f7f8]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-black/5 bg-white md:flex">
        <div className="border-b border-black/5 px-6 py-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-navy/5"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-4">
          <div className="md:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-navy">{user.name}</p>
              <p className="text-xs capitalize text-body">{user.roles.join(", ")}</p>
            </div>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
