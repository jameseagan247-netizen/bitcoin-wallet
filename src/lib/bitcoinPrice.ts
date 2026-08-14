let cachedPrice: number | null = null;
let cachedAt = 0;

const CACHE_DURATION = 60 * 1000;

export async function getBitcoinPriceUsd(): Promise<number | null> {
  const now = Date.now();

  if (
    cachedPrice !== null &&
    now - cachedAt < CACHE_DURATION
  ) {
    return cachedPrice;
  }

  try {
    const apiKey = process.env.COINGECKO_API_KEY;

    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
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

    if (!response.ok) {
      console.warn(
        `Bitcoin price request failed: ${response.status}`
      );

      return cachedPrice;
    }

    const data = await response.json();

    const price = data?.bitcoin?.usd;

    if (
      typeof price !== "number" ||
      !Number.isFinite(price)
    ) {
      console.warn(
        "Bitcoin price response was invalid."
      );

      return cachedPrice;
    }

    cachedPrice = price;
    cachedAt = now;

    return price;
  } catch (error) {
    console.warn(
      "Bitcoin price request error:",
      error
    );

    return cachedPrice;
  }
}