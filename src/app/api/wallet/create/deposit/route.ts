import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

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

    let body: { amount?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Enter a valid positive amount." },
        { status: 400 }
      );
    }

    if (amount > 10) {
      return NextResponse.json(
        { error: "Training deposits are limited to 10 BTC." },
        { status: 400 }
      );
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found." },
        { status: 404 }
      );
    }

    const currentBalance = Number(wallet.balance);
    const newBalance = currentBalance + amount;

    if (newBalance > 100) {
      return NextResponse.json(
        {
          error: "Training wallet balance cannot exceed 100 BTC.",
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
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
    console.error("Wallet creation deposit error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while processing the deposit.",
      },
      { status: 500 }
    );
  }
}
