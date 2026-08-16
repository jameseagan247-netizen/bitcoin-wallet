import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

function isValidBtcAmount(value: unknown): value is string | number {
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

    if (decimalPart && decimalPart.length > 8) {
      return false;
    }

    return Number(trimmed) > 0 && Number.isFinite(Number(trimmed));
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

    const adminUserId = await verifySession(sessionToken);

    if (!adminUserId) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const admin = await prisma.user.findUnique({
      where: {
        id: adminUserId,
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const targetUserId =
      typeof body?.userId === "string"
        ? body.userId.trim()
        : "";

    const username =
      typeof body?.username === "string"
        ? body.username.trim()
        : "";

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const rawAmount = body?.amount;

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

    if (amount.lessThanOrEqualTo(0)) {
      return NextResponse.json(
        { error: "BTC amount must be greater than zero." },
        { status: 400 }
      );
    }

    if (!targetUserId && !username && !email) {
      return NextResponse.json(
        {
          error:
            "Provide a user ID, username, or email address.",
        },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: targetUserId
        ? { id: targetUserId }
        : username
          ? { username }
          : { email },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({
        where: {
          userId: targetUser.id,
        },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: targetUser.id,
            balance: amount,
          },
        });
      } else {
        wallet = await tx.wallet.update({
          where: {
            id: wallet.id,
          },
          data: {
            balance: {
              increment: amount,
            },
          },
        });
      }

      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "DEPOSIT",
          amount,
          description: `BTC credit by administrator @${admin.username}`,
          status: "COMPLETED",
        },
      });

      return {
        wallet,
        transaction,
      };
    });

    return NextResponse.json({
      message: "BTC credited successfully.",
      user: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        name: `${targetUser.firstName} ${targetUser.lastName}`,
      },
      balance: result.wallet.balance.toString(),
      amount: amount.toString(),
      transactionId: result.transaction.id,
    });
  } catch (error) {
    console.error("Admin BTC credit error:", error);

    return NextResponse.json(
      {
        error: "Unable to credit BTC.",
      },
      { status: 500 }
    );
  }
}