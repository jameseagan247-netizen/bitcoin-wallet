"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

export default function DashboardNav() {
  const pathname = usePathname();

  const isDashboard = pathname === "/dashboard";

  const isTransactions =
    pathname === "/dashboard/transactions" ||
    pathname.startsWith("/dashboard/transactions/");

  const isSecurity =
    pathname === "/dashboard/security" ||
    pathname.startsWith("/dashboard/security/");

  return (
    <nav className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex min-h-16 items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="shrink-0 text-lg font-bold text-white transition hover:text-orange-400"
          >
            Lucentra Ledger
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/dashboard"
              className={`rounded-xl px-3 py-2 text-sm transition ${
                isDashboard
                  ? "bg-orange-500/10 text-orange-400"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/transactions"
              className={`rounded-xl px-3 py-2 text-sm transition ${
                isTransactions
                  ? "bg-orange-500/10 text-orange-400"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Transactions
            </Link>

            <Link
              href="/dashboard/security"
              className={`rounded-xl px-3 py-2 text-sm transition ${
                isSecurity
                  ? "bg-orange-500/10 text-orange-400"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Security
            </Link>

            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
