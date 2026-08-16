import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken =
      cookieStore.get("session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const userId =
      await verifySession(sessionToken);

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const withdrawals =
      await prisma.withdrawal.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          amount: true,
          usdAmount: true,
          btcUsdRate: true,
          bankName: true,
          accountName: true,
          accountNumberLast4: true,
          status: true,
          createdAt: true,
          walletId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      withdrawals,
    });
  } catch (error) {
    console.error(
      "Withdrawal lookup error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load withdrawal history.",
      },
      { status: 500 }
    );
  }
}