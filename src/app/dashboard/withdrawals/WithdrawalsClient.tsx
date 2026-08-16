"use client";

import { useCallback, useEffect, useState } from "react";

type Withdrawal = {
  id: string;
  amount: string;
  usdAmount: string;
  btcUsdRate: string;
  bankName: string;
  accountName: string;
  accountNumberLast4: string;
  status: string;
  createdAt: string;
  walletId: string;
};

export default function WithdrawalsClient() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const loadWithdrawals = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setMessage("");

        const response = await fetch(
          "/api/withdrawals",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(
            data.error ||
              "Unable to load withdrawals."
          );
          return;
        }

        setWithdrawals(data.withdrawals || []);
      } catch (error) {
        console.error(
          "Withdrawal history error:",
          error
        );

        setMessage(
          "Unable to connect to the server."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  function formatDate(value: string) {
    return new Date(value).toLocaleString(
      "en-GB",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  function getStatusClasses(status: string) {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "border-green-500/20 bg-green-500/10 text-green-400";

      case "FAILED":
        return "border-red-500/20 bg-red-500/10 text-red-400";

      case "CANCELLED":
        return "border-slate-500/20 bg-slate-500/10 text-slate-400";

      case "PENDING":
      default:
        return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
    }
  }

  function getStatusLabel(status: string) {
    return status.charAt(0) +
      status.slice(1).toLowerCase();
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          Loading withdrawal history...
        </p>
      </div>
    );
  }

  if (message) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <p className="text-sm text-red-400">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadWithdrawals(true)}
          disabled={refreshing}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing
            ? "Retrying..."
            : "Try again"}
        </button>
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <h2 className="text-xl font-semibold text-white">
          No withdrawals yet
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Your bank withdrawal requests will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {withdrawals.length}{" "}
          {withdrawals.length === 1
            ? "withdrawal"
            : "withdrawals"}
        </p>

        <button
          type="button"
          onClick={() => loadWithdrawals(true)}
          disabled={refreshing}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {withdrawals.map((withdrawal) => (
        <div
          key={withdrawal.id}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          {/* Top section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-white">
                  $
                  {Number(
                    withdrawal.usdAmount
                  ).toFixed(2)}
                </h2>

                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                    withdrawal.status
                  )}`}
                >
                  {getStatusLabel(
                    withdrawal.status
                  )}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-400">
                {withdrawal.bankName} {"••••"}{" "}
                {withdrawal.accountNumberLast4}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {withdrawal.accountName}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs uppercase tracking-wide text-slate-600">
                Requested
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {formatDate(
                  withdrawal.createdAt
                )}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="mt-6 grid gap-5 border-t border-slate-800 pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-600">
                BTC withdrawn
              </p>

              <p className="mt-1 text-sm text-slate-300">
                {Number(
                  withdrawal.amount
                ).toFixed(8)}{" "}
                BTC
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-600">
                BTC/USD rate
              </p>

              <p className="mt-1 text-sm text-slate-300">
                $
                {Number(
                  withdrawal.btcUsdRate
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-600">
                Withdrawal ID
              </p>

              <p className="mt-1 break-all text-xs text-slate-500">
                {withdrawal.id}
              </p>
            </div>
          </div>

          {/* Status explanation */}
          {withdrawal.status.toUpperCase() ===
            "PENDING" && (
            <div className="mt-5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
              <p className="text-xs text-yellow-400">
                This withdrawal is waiting to be
                processed.
              </p>
            </div>
          )}

          {withdrawal.status.toUpperCase() ===
            "COMPLETED" && (
            <div className="mt-5 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
              <p className="text-xs text-green-400">
                This withdrawal has been completed.
              </p>
            </div>
          )}

          {withdrawal.status.toUpperCase() ===
            "FAILED" && (
            <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
              <p className="text-xs text-red-400">
                This withdrawal could not be
                completed.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}