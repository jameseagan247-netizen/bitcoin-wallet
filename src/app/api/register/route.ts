import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      username,
      email,
      password,
      country,
    } = body;

    if (
      !firstName ||
      !lastName ||
      !username ||
      !email ||
      !password ||
      !country
    ) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const normalizedFirstName = String(firstName).trim();
    const normalizedLastName = String(lastName).trim();
    const normalizedUsername = String(username).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedCountry = String(country).trim();

    if (
      !normalizedFirstName ||
      !normalizedLastName ||
      !normalizedUsername ||
      !normalizedEmail ||
      !normalizedCountry
    ) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          {
            username: normalizedUsername,
          },
          {
            email: normalizedEmail,
          },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Username or email is already registered.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          username: normalizedUsername,
          email: normalizedEmail,
          passwordHash,
          country: normalizedCountry,
        },
      });

      const wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          address: crypto.randomUUID(),
        },
      });

      return {
        user,
        wallet,
      };
    });

    return NextResponse.json(
      {
        message: "Account created successfully.",
        user: {
          id: result.user.id,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          username: result.user.username,
          email: result.user.email,
          country: result.user.country,
        },
        wallet: {
          id: result.wallet.id,
          address: result.wallet.address,
          balance: result.wallet.balance.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the account.",
      },
      { status: 500 }
    );
  }
}
