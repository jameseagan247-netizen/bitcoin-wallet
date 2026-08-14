import { NextResponse } from "next/server";

type CachedChart = {
  prices: {
    timestamp: number;
    price: number;
  }[];
  cachedAt: number;
};

const chartCache = new Map<number, CachedChart>();

const CACHE_DURATION = 5 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const requestedDays = Number(
      searchParams.get("days") || "7"
    );

    const days = [1, 7, 30].includes(requestedDays)
      ? requestedDays
      : 7;

    const now = Date.now();

    const cached = chartCache.get(days);

    if (
      cached &&
      now - cached.cachedAt < CACHE_DURATION
    ) {
      console.log(
        `Using cached Bitcoin ${days}D chart`
      );

      return NextResponse.json(
        {
          prices: cached.prices,
        },
        {
          headers: {
            "Cache-Control":
              "s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    }

    console.log(
      `Requesting Bitcoin ${days}D chart from CoinGecko`
    );

    const apiKey = process.env.COINGECKO_API_KEY;

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`,
      {
        headers: {
          Accept: "application/json",
          ...(apiKey
            ? {
                "x-cg-demo-api-key": apiKey,
              }
            : {}),
        },
        cache: "no-store",
      }
    );

    if (response.status === 429) {
      console.warn(
        "CoinGecko rate limit reached."
      );

      if (cached) {
        console.log(
          `Returning stale Bitcoin ${days}D chart`
        );

        return NextResponse.json(
          {
            prices: cached.prices,
          },
          {
            headers: {
              "Cache-Control":
                "s-maxage=300, stale-while-revalidate=600",
            },
          }
        );
      }

      return NextResponse.json(
        {
          error:
            "Bitcoin chart temporarily unavailable",
        },
        {
          status: 503,
        }
      );
    }

    if (!response.ok) {
      console.error(
        "CoinGecko chart request failed:",
        response.status
      );

      if (cached) {
        return NextResponse.json(
          {
            prices: cached.prices,
          },
          {
            headers: {
              "Cache-Control":
                "s-maxage=300, stale-while-revalidate=600",
            },
          }
        );
      }

      return NextResponse.json(
        {
          error: "Bitcoin chart unavailable",
        },
        {
          status: 503,
        }
      );
    }

    const data = await response.json();

    if (
      !data ||
      !Array.isArray(data.prices)
    ) {
      return NextResponse.json(
        {
          error: "Invalid Bitcoin chart data",
        },
        {
          status: 503,
        }
      );
    }

    const prices = data.prices
      .filter(
        (item: unknown): item is [number, number] =>
          Array.isArray(item) &&
          item.length >= 2 &&
          typeof item[0] === "number" &&
          typeof item[1] === "number"
      )
      .map(
        ([timestamp, price]: [
          number,
          number
        ]) => ({
          timestamp,
          price,
        })
      );

    chartCache.set(days, {
      prices,
      cachedAt: now,
    });

    return NextResponse.json(
      {
        prices,
      },
      {
        headers: {
          "Cache-Control":
            "s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error(
      "Bitcoin chart request error:",
      error
    );

    return NextResponse.json(
      {
        error: "Bitcoin chart unavailable",
      },
      {
        status: 503,
      }
    );
  }
}