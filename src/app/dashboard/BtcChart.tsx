"use client";

import { useEffect, useMemo, useState } from "react";

type PricePoint = {
  timestamp: number;
  price: number;
};

type Timeframe = {
  label: string;
  days: number;
};

const timeframes: Timeframe[] = [
  {
    label: "24H",
    days: 1,
  },
  {
    label: "7D",
    days: 7,
  },
  {
    label: "30D",
    days: 30,
  },
];

export default function BtcChart() {
  const [selectedDays, setSelectedDays] = useState(7);

  const [prices, setPrices] = useState<PricePoint[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);

useEffect(() => {
  let cancelled = false;

  async function loadPrices() {
    setLoading(true);
    setError(false);

    try {
      const response = await fetch(
        `/api/bitcoin-chart?days=${selectedDays}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Chart request failed: ${response.status}`
        );
      }

      const data = await response.json();

      if (
        !cancelled &&
        Array.isArray(data.prices)
      ) {
        setPrices(data.prices);
      }
    } catch (error) {
      console.warn("BTC chart error:", error);

      if (!cancelled) {
        setError(true);
        setPrices([]);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  loadPrices();

  return () => {
    cancelled = true;
  };
}, [selectedDays]);


  const chart = useMemo(() => {
    if (prices.length < 2) {
      return null;
    }

    const width = 800;
    const height = 300;

    const padding = {
      top: 20,
      right: 20,
      bottom: 35,
      left: 20,
    };

    const chartWidth =
      width -
      padding.left -
      padding.right;

    const chartHeight =
      height -
      padding.top -
      padding.bottom;

    const values = prices.map(
      (point) => point.price
    );

    const minPrice = Math.min(...values);
    const maxPrice = Math.max(...values);

    const range =
      maxPrice - minPrice || 1;

    const points = prices
      .map((point, index) => {
        const x =
          padding.left +
          (index / (prices.length - 1)) *
            chartWidth;

        const y =
          padding.top +
          (1 -
            (point.price - minPrice) /
              range) *
            chartHeight;

        return `${x},${y}`;
      })
      .join(" ");

    const firstPrice = prices[0].price;
    const lastPrice =
      prices[prices.length - 1].price;

    const change =
      lastPrice - firstPrice;

    const changePercent =
      firstPrice !== 0
        ? (change / firstPrice) * 100
        : 0;

    return {
      width,
      height,
      points,
      minPrice,
      maxPrice,
      firstPrice,
      lastPrice,
      change,
      changePercent,
    };
  }, [prices]);

  return (
    <div>
      {/* Timeframe buttons */}
      <div className="mb-5 flex flex-wrap gap-2">
        {timeframes.map((timeframe) => {
          const active =
            selectedDays === timeframe.days;

          return (
            <button
              key={timeframe.days}
              type="button"
              onClick={() =>
                setSelectedDays(timeframe.days)
              }
              className={
                active
                  ? "rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white"
                  : "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-400 transition hover:border-orange-400 hover:text-white"
              }
            >
              {timeframe.label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex h-72 items-center justify-center rounded-xl bg-slate-950">
          <p className="text-sm text-slate-500">
            Loading Bitcoin price history...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex h-72 items-center justify-center rounded-xl bg-slate-950">
          <div className="text-center">
            <p className="text-sm text-slate-400">
              Bitcoin chart is temporarily unavailable.
            </p>

            <p className="mt-2 text-xs text-slate-600">
              Please try another timeframe.
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      {!loading &&
        !error &&
        chart && (
          <div>
            {/* Summary */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  $
                  {chart.lastPrice.toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Current chart price
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p
                  className={
                    chart.change >= 0
                      ? "font-semibold text-green-400"
                      : "font-semibold text-red-400"
                  }
                >
                  {chart.change >= 0
                    ? "+"
                    : ""}
                  $
                  {chart.change.toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </p>

                <p
                  className={
                    chart.changePercent >= 0
                      ? "text-sm text-green-400"
                      : "text-sm text-red-400"
                  }
                >
                  {chart.changePercent >= 0
                    ? "+"
                    : ""}
                  {chart.changePercent.toFixed(2)}
                  %
                </p>
              </div>
            </div>

            {/* SVG chart */}
            <div className="overflow-hidden rounded-xl bg-slate-950 p-3">
              <svg
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                className="h-auto w-full"
                role="img"
                aria-label="Bitcoin price chart"
              >
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-orange-400"
                  points={chart.points}
                />
              </svg>
            </div>

            {/* Range */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
              <span>
                $
                {chart.minPrice.toLocaleString(
                  "en-US",
                  {
                    maximumFractionDigits: 0,
                  }
                )}
              </span>

              <span>
                $
                {chart.maxPrice.toLocaleString(
                  "en-US",
                  {
                    maximumFractionDigits: 0,
                  }
                )}
              </span>
            </div>
          </div>
        )}

      {!loading &&
        !error &&
        !chart && (
          <div className="flex h-72 items-center justify-center rounded-xl bg-slate-950">
            <p className="text-sm text-slate-500">
              Not enough Bitcoin price data available.
            </p>
          </div>
        )}
    </div>
  );
}
