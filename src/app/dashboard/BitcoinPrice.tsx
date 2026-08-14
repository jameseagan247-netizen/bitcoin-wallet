"use client";

import { useEffect, useState } from "react";

type BitcoinPriceProps = {
  initialPrice: number | null;
};

export default function BitcoinPrice({
  initialPrice,
}: BitcoinPriceProps) {
  const [price, setPrice] = useState<number | null>(
    initialPrice
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refreshPrice() {
      if (cancelled) {
        return;
      }

      setIsRefreshing(true);

      try {
        const response = await fetch("/api/bitcoin-price", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Bitcoin price request failed: ${response.status}`
          );
        }

        const data = await response.json();

        if (
          !cancelled &&
          typeof data.price === "number" &&
          Number.isFinite(data.price)
        ) {
          setPrice(data.price);
        }
      } catch (error) {
        console.warn(
          "Bitcoin price refresh failed:",
          error
        );
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    }

    // Wait 60 seconds before the first refresh.
    const timeout = window.setTimeout(() => {
      refreshPrice();
    }, 60_000);

    // Then refresh once every 60 seconds.
    const interval = window.setInterval(() => {
      refreshPrice();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  if (price === null) {
    return (
      <p className="mt-1 text-sm text-slate-400">
        Bitcoin price unavailable
      </p>
    );
  }

  return (
    <div className="mt-1">
      <p className="text-lg font-semibold text-white">
        $
        {price.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>

      {isRefreshing && (
        <p className="mt-1 text-xs text-slate-500">
          Updating...
        </p>
      )}
    </div>
  );
}
