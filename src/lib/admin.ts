import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

export async function requireAdmin(request: Request) {
  const cookieHeader = request.headers.get("cookie");

  const sessionToken = cookieHeader
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("session="))
    ?.split("=")
    .slice(1)
    .join("=");

  if (!sessionToken) {
    return null;
  }

  const userId = await verifySession(sessionToken);

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}
