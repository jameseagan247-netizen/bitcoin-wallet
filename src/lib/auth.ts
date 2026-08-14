import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = process.env.SESSION_SECRET;

if (!secret) {
  throw new Error("SESSION_SECRET is not configured.");
}

const secretKey = new TextEncoder().encode(secret);

export async function createSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      sessionVersion: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  return new SignJWT({
    userId,
    sessionVersion: user.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (
      !payload.userId ||
      typeof payload.userId !== "string" ||
      typeof payload.sessionVersion !== "number"
    ) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        sessionVersion: true,
      },
    });

    if (!user) {
      return null;
    }

    if (user.sessionVersion !== payload.sessionVersion) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}