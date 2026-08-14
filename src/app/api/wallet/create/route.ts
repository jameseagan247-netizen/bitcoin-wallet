import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST() {
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

    const existingWallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
    });

    if (existingWallet) {
      if (!existingWallet.address) {
        const updatedWallet = await prisma.wallet.update({
          where: {
            id: existingWallet.id,
          },
          data: {
            address: `training_${randomUUID()}`,
          },
        });

        return NextResponse.json({
          message: "Wallet address created.",
          wallet: updatedWallet,
        });
      }

      return NextResponse.json({
        message: "Wallet already exists.",
        wallet: existingWallet,
      });
    }

    const wallet = await prisma.wallet.create({
      data: {
        userId,
        address: `training_${randomUUID()}`,
      },
    });

    return NextResponse.json({
      message: "Wallet created successfully.",
      wallet,
    });
  } catch (error) {
    console.error("Wallet creation error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while creating the wallet.",
      },
      { status: 500 }
    );
  }
}
