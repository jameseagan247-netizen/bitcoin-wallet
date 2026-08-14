"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Transaction = {
  id: string;
  type: string;
  amount: string;
  description: string | null;
  status: string;
  createdAt: string;
};

type TransactionsClientProps = {
  transactions: Transaction[];
  bitcoinPriceUsd: number | null;
};

type Filter = "ALL" | "DEPOSIT" | "WITHDRAWAL";

export default function TransactionsClient({
  transactions,
  bitcoinPriceUsd,
}: TransactionsClientProps) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const filteredTransactions = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    const result = transactions.filter((transaction) => {
      const matchesFilter =
        filter === "ALL" || transaction.type === filter;

      if (!matchesFilter) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      const description =
        transaction.description?.toLowerCase() || "";

      const id = transaction.id.toLowerCase();

      return (
        description.includes(searchTerm) ||
        id.includes(searchTerm) ||
        transaction.type
          .toLowerCase()
          .includes(searchTerm)
      );
    });

    return [...result].sort((a, b) => {
      const first = new Date(a.createdAt).getTime();
      const second = new Date(b.createdAt).getTime();

      return sortNewestFirst
        ? second - first
        : first - second;
    });
  }, [
    transactions,
    filter,
    search,
    sortNewestFirst,
  ]);

  return (
    <div>
      {/* Controls */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <label
              htmlFor="transaction-search"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Search transactions
            </label>

            <input
              id="transaction-search"
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search description, type, or transaction ID..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400"
            />
          </div>

          <div className="lg:min-w-48">
            <label
              htmlFor="transaction-sort"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Sort
            </label>

            <select
              id="transaction-sort"
              value={sortNewestFirst ? "newest" : "oldest"}
              onChange={(event) =>
                setSortNewestFirst(
                  event.target.value === "newest"
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-400"
            >
              <option value="newest">
                Newest first
              </option>

              <option value="oldest">
                Oldest first
              </option>
            </select>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              ["ALL", "All"],
              ["DEPOSIT", "Deposits"],
              ["WITHDRAWAL", "Withdrawals"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={
                filter === value
                  ? "rounded-xl bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-400 ring-1 ring-orange-400/30"
                  : "rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {filteredTransactions.length}{" "}
            {filteredTransactions.length === 1
              ? "transaction"
              : "transactions"}
          </p>

          {(search || filter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilter("ALL");
              }}
              className="text-sm text-orange-400 transition hover:text-orange-300"
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <p className="text-slate-300">
              No transactions found.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => {
              const isDeposit =
                transaction.type === "DEPOSIT";

              const amountUsd =
                bitcoinPriceUsd !== null
                  ? Number(transaction.amount) *
                    bitcoinPriceUsd
                  : null;

              return (
                <Link
                  key={transaction.id}
                  href={`/dashboard/transactions/${transaction.id}`}
                  className="block rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-orange-400 hover:bg-slate-800/70"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Transaction information */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={
                            isDeposit
                              ? "rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400"
                              : "rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400"
                          }
                        >
                          {isDeposit
                            ? "DEPOSIT"
                            : "WITHDRAWAL"}
                        </span>

                        <span className="font-medium text-white">
                          {transaction.description ||
                            (isDeposit
                              ? "deposit"
                              : "withdrawal")}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        {new Date(
                          transaction.createdAt
                        ).toLocaleString()}
                      </p>

                      <p className="mt-2 break-all text-xs text-slate-600">
                        {transaction.id}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="shrink-0 sm:text-right">
                      <p
                        className={
                          isDeposit
                            ? "font-semibold text-green-400"
                            : "font-semibold text-red-400"
                        }
                      >
                        {isDeposit ? "+" : "-"}
                        {transaction.amount} BTC
                      </p>

                      {amountUsd !== null && (
                        <p
                          className={
                            isDeposit
                              ? "mt-1 text-sm text-green-400/80"
                              : "mt-1 text-sm text-red-400/80"
                          }
                        >
                          {isDeposit ? "+" : "-"}$
                          {amountUsd.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-slate-500">
                        {transaction.status}
                      </p>

                      <p className="mt-2 text-xs font-medium text-orange-400">
                        View details →
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}