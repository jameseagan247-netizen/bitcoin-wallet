import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { getBitcoinPriceUsd } from "@/lib/bitcoinPrice";

const MAX_USD_DECIMAL_PLACES = 2;

function isValidUsdAmount(
  value: unknown
): value is string | number {
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

    if (
      decimalPart &&
      decimalPart.length > MAX_USD_DECIMAL_PLACES
    ) {
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
    const sessionToken =
      cookieStore.get("session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const userId =
      await verifySession(sessionToken);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Invalid session.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const rawUsdAmount = body?.usdAmount;

    if (!isValidUsdAmount(rawUsdAmount)) {
      return NextResponse.json(
        {
          error:
            "Enter a valid USD withdrawal amount with up to 2 decimal places.",
        },
        { status: 400 }
      );
    }

    const usdAmount = new Prisma.Decimal(
      String(rawUsdAmount).trim()
    );

    const bankAccountId =
      body?.bankAccountId;

    if (
      typeof bankAccountId !== "string" ||
      !bankAccountId.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Please select a bank account.",
        },
        { status: 400 }
      );
    }

    const bitcoinPriceUsd =
      await getBitcoinPriceUsd();

    if (
      bitcoinPriceUsd === null ||
      !Number.isFinite(bitcoinPriceUsd) ||
      bitcoinPriceUsd <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "The current BTC/USD rate is temporarily unavailable. Please try again shortly.",
        },
        { status: 503 }
      );
    }

    const btcUsdRate = new Prisma.Decimal(
      bitcoinPriceUsd.toFixed(2)
    );

    const btcAmount =
      usdAmount.div(btcUsdRate);

    const result = await prisma.$transaction(
      async (tx) => {
        const wallet =
          await tx.wallet.findUnique({
            where: {
              userId,
            },
          });

        if (!wallet) {
          throw new Error(
            "WALLET_NOT_FOUND"
          );
        }

        if (
          wallet.balance.lessThan(btcAmount)
        ) {
          throw new Error(
            "INSUFFICIENT_BALANCE"
          );
        }

        const bankAccount =
          await tx.bankAccount.findFirst({
            where: {
              id: bankAccountId,
              userId,
              verified: true,
            },
          });

        if (!bankAccount) {
          throw new Error(
            "BANK_ACCOUNT_NOT_FOUND"
          );
        }

        const newBalance =
          wallet.balance.minus(btcAmount);

        await tx.wallet.update({
          where: {
            id: wallet.id,
          },
          data: {
            balance: newBalance,
          },
        });

        const withdrawal =
          await tx.withdrawal.create({
            data: {
              userId,
              walletId: wallet.id,
              amount: btcAmount,
              usdAmount,
              btcUsdRate,
              bankName:
                bankAccount.bankName,
              accountName:
                bankAccount.accountName,
              accountNumberLast4:
                bankAccount.accountNumberLast4,
              status: "PENDING",
            },
          });

        const transaction =
          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              type: "WITHDRAWAL",
              amount: btcAmount,
              description: `Bank withdrawal request - $${usdAmount.toFixed(2)}`,
              status: "PENDING",
            },
          });

        return {
          balance: newBalance,
          withdrawalId:
            withdrawal.id,
          transactionId:
            transaction.id,
          btcAmount,
          usdAmount,
          btcUsdRate,
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel
            .Serializable,
      }
    );

    return NextResponse.json({
      message:
        "Withdrawal request submitted.",
      balance:
        result.balance.toString(),
      withdrawalId:
        result.withdrawalId,
      transactionId:
        result.transactionId,
      usdAmount:
        result.usdAmount.toString(),
      btcAmount:
        result.btcAmount.toString(),
      btcUsdRate:
        result.btcUsdRate.toString(),
      status: "PENDING",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message ===
        "INSUFFICIENT_BALANCE"
      ) {
        return NextResponse.json(
          {
            error:
              "Insufficient balance for this withdrawal.",
          },
          { status: 400 }
        );
      }

      if (
        error.message ===
        "WALLET_NOT_FOUND"
      ) {
        return NextResponse.json(
          {
            error: "Wallet not found.",
          },
          { status: 404 }
        );
      }

      if (
        error.message ===
        "BANK_ACCOUNT_NOT_FOUND"
      ) {
        return NextResponse.json(
          {
            error:
              "The selected bank account is not available or has not been verified.",
          },
          { status: 400 }
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

    console.error(
      "Withdrawal error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while processing the withdrawal.",
      },
      { status: 500 }
    );
  }
}