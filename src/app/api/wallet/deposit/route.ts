import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const MAX_DECIMAL_PLACES = 8;
const MAX_DEPOSIT = "10";

function isValidAmount(value: unknown): value is string | number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) {
      return false;
    }

    const decimalPart = trimmed.split(".")[1];

    if (decimalPart && decimalPart.length > MAX_DECIMAL_PLACES) {
      return false;
    }

    const numericValue = Number(trimmed);

    return Number.isFinite(numericValue) && numericValue > 0;
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const userId = await verifySession(sessionToken);

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const rawAmount = body?.amount;

    if (!isValidAmount(rawAmount)) {
      return NextResponse.json(
        {
          error:
            "Enter a valid positive BTC amount with up to 8 decimal places.",
        },
        { status: 400 }
      );
    }

    const amount = String(rawAmount).trim();

    if (Number(amount) > Number(MAX_DEPOSIT)) {
      return NextResponse.json(
        { error: "Training deposits are limited to 10 BTC." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          userId,
        },
      });

      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      const newBalance = wallet.balance.plus(amount);

      const updatedWallet = await tx.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: newBalance,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "DEPOSIT",
          amount,
          description: "Training deposit",
          status: "COMPLETED",
        },
      });

      return {
        wallet: updatedWallet,
        transaction,
      };
    });

    return NextResponse.json({
      message: "Training deposit successful.",
      balance: result.wallet.balance.toString(),
      transactionId: result.transaction.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "WALLET_NOT_FOUND") {
      return NextResponse.json(
        { error: "Wallet not found." },
        { status: 404 }
      );
    }

    console.error("Deposit error:", error);

    return NextResponse.json(
      { error: "Something went wrong while processing the deposit." },
      { status: 500 }
    );
  }
}