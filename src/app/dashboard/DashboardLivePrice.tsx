"use client";

import { useEffect, useState } from "react";

type TransactionInfo = {
  type: string;
  amount: number;
};

type DashboardLivePriceProps = {
  initialPrice: number | null;
  balanceBtc: number;
  totalDeposits: number;
  totalWithdrawals: number;
  latestTransaction: TransactionInfo | null;
  compact?:
    | "deposits"
    | "withdrawals"
    | "portfolio"
    | "transaction";
};

function formatUsd(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function DashboardLivePrice({
  initialPrice,
  balanceBtc,
  totalDeposits,
  totalWithdrawals,
  latestTransaction,
  compact,
}: DashboardLivePriceProps) {
  const [price, setPrice] =
    useState<number | null>(initialPrice);

  const [lastUpdated, setLastUpdated] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refreshPrice() {
      try {
        const response = await fetch(
          "/api/bitcoin-price",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (
          typeof data.price !== "number" ||
          !Number.isFinite(data.price)
        ) {
          return;
        }

        if (cancelled) {
          return;
        }

        setPrice(data.price);

        setLastUpdated(
          new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      } catch {
        // Keep the last successful price.
      }
    }

    refreshPrice();

    const interval = window.setInterval(
      refreshPrice,
      60 * 1000
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  /*
   * Compact displays
   */

  if (compact === "deposits") {
    return (
      <p className="mt-1 text-sm text-green-400/70">
        {price === null
          ? "Unavailable"
          : formatUsd(totalDeposits * price)}
      </p>
    );
  }

  if (compact === "withdrawals") {
    return (
      <p className="mt-1 text-sm text-red-400/70">
        {price === null
          ? "Unavailable"
          : formatUsd(totalWithdrawals * price)}
      </p>
    );
  }

  if (compact === "portfolio") {
    return (
      <p className="mt-2 text-xl font-semibold text-white">
        {price === null
          ? "Unavailable"
          : formatUsd(balanceBtc * price)}
      </p>
    );
  }

  if (compact === "transaction") {
    return (
      <div className="shrink-0 sm:text-right">
        <p
          className={
            latestTransaction?.type === "DEPOSIT"
              ? "font-semibold text-green-400"
              : "font-semibold text-red-400"
          }
        >
          {latestTransaction?.type ===
          "DEPOSIT"
            ? "+"
            : "-"}
          {latestTransaction?.amount.toString()} BTC
        </p>

        {price !== null &&
          latestTransaction && (
            <p className="mt-1 text-sm text-slate-400">
              {latestTransaction.type ===
              "DEPOSIT"
                ? "+"
                : "-"}
              {formatUsd(
                latestTransaction.amount *
                  price
              )}
            </p>
          )}
      </div>
    );
  }

  /*
   * Full wallet price display
   */

  const walletValue =
    price !== null
      ? balanceBtc * price
      : null;

  return (
    <div className="mt-6 rounded-xl bg-slate-950 p-5">
      <p className="text-sm text-slate-500">
        Bitcoin balance
      </p>

      <p className="mt-2 text-3xl font-bold">
        {balanceBtc.toFixed(8)} BTC
      </p>

      <p className="mt-2 text-lg font-medium text-slate-300">
        {walletValue === null
          ? "Unavailable"
          : formatUsd(walletValue)}
      </p>

      <div className="mt-3">
        <p className="text-xs text-slate-500">
          Current BTC price
        </p>

        {price === null ? (
          <p className="mt-1 text-sm text-slate-500">
            Unavailable
          </p>
        ) : (
          <p className="mt-1 text-lg font-medium text-slate-300">
            {formatUsd(price)}
          </p>
        )}

        {lastUpdated && (
          <p className="mt-1 text-xs text-slate-500">
            Updated {lastUpdated}
          </p>
        )}
      </div>
    </div>
  );
}