import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

    const body = await request.json();

    const currentPassword = String(body?.currentPassword ?? "");
    const newPassword = String(body?.newPassword ?? "");

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new passwords are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const passwordIsCorrect = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!passwordIsCorrect) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash,
        sessionVersion: {
          increment: 1,
        },
      },
    });

    const response = NextResponse.json({
      message: "Password changed successfully. Please log in again.",
    });

    response.cookies.set({
      name: "session",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Password change error:", error);

    return NextResponse.json(
      { error: "Something went wrong while changing the password." },
      { status: 500 }
    );
  }
}