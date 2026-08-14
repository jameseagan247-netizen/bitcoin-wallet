import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

const MAX_DECIMAL_PLACES = 8;

function isValidAmount(value: unknown): value is string | number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return false;
    }

    if (!/^\d+(\.\d+)?$/.test(trimmed)) {
      return false;
    }

    const decimalPart = trimmed.split(".")[1];

    if (decimalPart && decimalPart.length > MAX_DECIMAL_PLACES) {
      return false;
    }

    return (
      Number(trimmed) > 0 &&
      Number.isFinite(Number(trimmed))
    );
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

    const amount = new Prisma.Decimal(
      String(rawAmount).trim()
    );

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found." },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const currentWallet = await tx.wallet.findUnique({
          where: {
            id: wallet.id,
          },
        });

        if (!currentWallet) {
          throw new Error("WALLET_NOT_FOUND");
        }

        if (currentWallet.balance.lessThan(amount)) {
          throw new Error("INSUFFICIENT_BALANCE");
        }

        const newBalance =
          currentWallet.balance.minus(amount);

        const updatedWallet = await tx.wallet.update({
          where: {
            id: currentWallet.id,
          },
          data: {
            balance: newBalance,
          },
        });

        const transaction =
          await tx.transaction.create({
            data: {
              walletId: currentWallet.id,
              type: "WITHDRAWAL",
              amount,
              description: "Training withdrawal",
              status: "COMPLETED",
            },
          });

        return {
          wallet: updatedWallet,
          transaction,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    return NextResponse.json({
      message: "Training withdrawal successful.",
      balance: result.wallet.balance.toString(),
      transactionId: result.transaction.id,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INSUFFICIENT_BALANCE") {
        return NextResponse.json(
          {
            error: "Insufficient training balance.",
          },
          { status: 400 }
        );
      }

      if (error.message === "WALLET_NOT_FOUND") {
        return NextResponse.json(
          {
            error: "Wallet not found.",
          },
          { status: 404 }
        );
      }

      if (
        error.message.includes(
          "Transaction failed due to a write conflict"
        ) ||
        error.message.includes(
          "could not serialize access"
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Another wallet transaction is being processed. Please try again.",
          },
          { status: 409 }
        );
      }
    }

    console.error("Withdrawal error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while processing the withdrawal.",
      },
      { status: 500 }
    );
  }
}
