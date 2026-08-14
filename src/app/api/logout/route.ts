import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (sessionToken) {
      const userId = await verifySession(sessionToken);

      if (userId) {
        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            sessionVersion: {
              increment: 1,
            },
          },
        });
      }
    }

    const response = NextResponse.json({
      message: "Logged out successfully.",
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
    console.error("Logout error:", error);

    const response = NextResponse.json({
      message: "Logged out successfully.",
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
  }
}