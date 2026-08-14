import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");

    const ip =
      forwardedFor?.split(",")[0]?.trim() ||
      realIp ||
      "unknown";

    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Email and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    // Limit attempts from the same IP.
    const ipLimit = checkRateLimit(`login:ip:${ip}`);

    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error:
            "Too many login attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(ipLimit.retryAfter),
          },
        }
      );
    }

    // Also limit attempts against the same email.
    const emailLimit = checkRateLimit(`login:email:${email}`);

    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          error:
            "Too many login attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(emailLimit.retryAfter),
          },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    const passwordIsCorrect = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordIsCorrect) {
      return NextResponse.json(
        {
          error: "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    const sessionToken = await createSession(user.id);

    const response = NextResponse.json({
      message: "Login successful.",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        country: user.country,
      },
    });

    response.cookies.set({
      name: "session",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while logging in.",
      },
      {
        status: 500,
      }
    );
  }
}
