import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const clients = await prisma.user.findMany({
      where: {
        role: {
          not: "ADMIN",
        },
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        country: true,
        createdAt: true,
        wallet: {
          select: {
            id: true,
            balance: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      clients: clients.map((client) => ({
        id: client.id,
        username: client.username,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        country: client.country,
        createdAt: client.createdAt.toISOString(),
        wallet: client.wallet
          ? {
              id: client.wallet.id,
              balance: client.wallet.balance.toString(),
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Admin clients error:", error);

    return NextResponse.json(
      { error: "Unable to load clients." },
      { status: 500 }
    );
  }
}
