import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

async function getAuthenticatedUserId() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    return null;
  }

  return await verifySession(sessionToken);
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const bankAccounts =
      await prisma.bankAccount.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          accountName: true,
          bankName: true,
          accountNumberLast4: true,
          country: true,
          verified: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      bankAccounts,
    });
  } catch (error) {
    console.error(
      "Bank account lookup error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load bank account information.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const accountName =
      typeof body?.accountName === "string"
        ? body.accountName.trim()
        : "";

    const bankName =
      typeof body?.bankName === "string"
        ? body.bankName.trim()
        : "";

    const accountNumber =
      typeof body?.accountNumber === "string"
        ? body.accountNumber.trim()
        : "";

    const country =
      typeof body?.country === "string"
        ? body.country.trim()
        : "";

    if (!accountName) {
      return NextResponse.json(
        {
          error:
            "Enter the account holder name.",
        },
        { status: 400 }
      );
    }

    if (!bankName) {
      return NextResponse.json(
        { error: "Enter the bank name." },
        { status: 400 }
      );
    }

    if (!country) {
      return NextResponse.json(
        { error: "Enter the country." },
        { status: 400 }
      );
    }

    const cleanedAccountNumber =
      accountNumber.replace(/\s+/g, "");

    if (!/^\d{4,}$/.test(cleanedAccountNumber)) {
      return NextResponse.json(
        {
          error:
            "Enter a valid bank account number.",
        },
        { status: 400 }
      );
    }

    const accountNumberLast4 =
      cleanedAccountNumber.slice(-4);

    const bankAccount =
      await prisma.bankAccount.create({
        data: {
          userId,
          accountName,
          bankName,
          accountNumberLast4,
          country,
          verified: true,
        },
        select: {
          id: true,
          accountName: true,
          bankName: true,
          accountNumberLast4: true,
          country: true,
          verified: true,
        },
      });

    return NextResponse.json(
      {
        message:
          "Bank account added successfully.",
        bankAccount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Bank account creation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to add bank account.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId =
      await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const bankAccountId =
      searchParams.get("id");

    if (!bankAccountId) {
      return NextResponse.json(
        {
          error:
            "Bank account ID is required.",
        },
        { status: 400 }
      );
    }

    const bankAccount =
      await prisma.bankAccount.findFirst({
        where: {
          id: bankAccountId,
          userId,
        },
      });

    if (!bankAccount) {
      return NextResponse.json(
        {
          error:
            "Bank account not found.",
        },
        { status: 404 }
      );
    }

    await prisma.bankAccount.delete({
      where: {
        id: bankAccount.id,
      },
    });

    return NextResponse.json({
      message:
        "Bank account removed successfully.",
    });
  } catch (error) {
    console.error(
      "Bank account deletion error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to remove bank account.",
      },
      { status: 500 }
    );
  }
}