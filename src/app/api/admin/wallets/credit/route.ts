import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

function isValidBtcAmount(value: unknown): value is string | number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!/^\d+(\.\d+)?$/.test(trimmed)) {
      return false;
    }

    const decimalPart = trimmed.split(".")[1];

    if (decimalPart && decimalPart.length > 8) {
      return false;
    }

    return Number(trimmed) > 0 && Number.isFinite(Number(trimmed));
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const userId = body?.userId;
    const rawAmount = body?.amount;
    const description =
      typeof body?.description === "string"
        ? body.description.trim()
        : "";

    if (
      typeof userId !== "string" ||
      !userId.trim()
    ) {
      return NextResponse.json(
        { error: "A client user ID is required." },
        { status: 400 }
      );
    }

    if (!isValidBtcAmount(rawAmount)) {
      return NextResponse.json(
        {
          error:
            "Enter a valid BTC amount with up to 8 decimal places.",
        },
        { status: 400 }
      );
    }

    const amount = new Prisma.Decimal(
      String(rawAmount).trim()
    );

    const result = await prisma.$transaction(
      async (tx) => {
        const client = await tx.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            id: true,
            username: true,
            role: true,
            wallet: {
              select: {
                id: true,
                balance: true,
              },
            },
          },
        });

        if (!client) {
          throw new Error("CLIENT_NOT_FOUND");
        }

        if (client.role === "ADMIN") {
          throw new Error("CANNOT_CREDIT_ADMIN");
        }

        if (!client.wallet) {
          throw new Error("WALLET_NOT_FOUND");
        }

        const newBalance =
          client.wallet.balance.plus(amount);

        await tx.wallet.update({
          where: {
            id: client.wallet.id,
          },
          data: {
            balance: newBalance,
          },
        });

        const transaction =
          await tx.transaction.create({
            data: {
              walletId: client.wallet.id,
              type: "DEPOSIT",
              amount,
              description:
                description ||
                `BTC credited by admin ${admin.username}`,
              status: "COMPLETED",
            },
          });

          await tx.auditLog.create({
  data: {
    actorUserId: admin.id,
    targetUserId: client.id,
    action: "CREDIT_BTC",
    amount,
    previousBalance: client.wallet.balance,
    newBalance,
    description:
      description ||
      `BTC credited by admin ${admin.username}`,
  },
});

        return {
          clientId: client.id,
          username: client.username,
          amount,
          balance: newBalance,
          transactionId: transaction.id,
        };
      }
    );

    return NextResponse.json({
      message: "BTC credited successfully.",
      clientId: result.clientId,
      username: result.username,
      amount: result.amount.toString(),
      balance: result.balance.toString(),
      transactionId: result.transactionId,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CLIENT_NOT_FOUND") {
        return NextResponse.json(
          { error: "Client not found." },
          { status: 404 }
        );
      }

      if (error.message === "WALLET_NOT_FOUND") {
        return NextResponse.json(
          { error: "Client wallet not found." },
          { status: 404 }
        );
      }

      if (error.message === "CANNOT_CREDIT_ADMIN") {
        return NextResponse.json(
          { error: "Admin wallets cannot be credited through this endpoint." },
          { status: 400 }
        );
      }
    }

    console.error("Admin BTC credit error:", error);

    return NextResponse.json(
      { error: "Unable to credit BTC." },
      { status: 500 }
    );
  }
}
