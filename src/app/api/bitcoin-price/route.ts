import { NextResponse } from "next/server";
import { getBitcoinPriceUsd } from "@/lib/bitcoinPrice";

export async function GET() {
  try {
    const price = await getBitcoinPriceUsd();

    if (price === null) {
      return NextResponse.json(
        {
          error: "Bitcoin price is currently unavailable.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        price,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Bitcoin price API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to retrieve Bitcoin price.",
      },
      { status: 500 }
    );
  }
}
