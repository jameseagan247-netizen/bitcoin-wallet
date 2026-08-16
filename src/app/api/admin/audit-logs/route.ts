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

    const auditLogs = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    const userIds = Array.from(
      new Set(
        auditLogs.flatMap((log) => [
          log.actorUserId,
          log.targetUserId,
        ])
      )
    );

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        username: true,
      },
    });

    const usersById = new Map(
      users.map((user) => [user.id, user.username])
    );

    return NextResponse.json({
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        actorUserId: log.actorUserId,
        actorUsername:
          usersById.get(log.actorUserId) ?? "Unknown",
        targetUserId: log.targetUserId,
        targetUsername:
          usersById.get(log.targetUserId) ?? "Unknown",
        action: log.action,
        amount: log.amount?.toString() ?? null,
        previousBalance:
          log.previousBalance?.toString() ?? null,
        newBalance:
          log.newBalance?.toString() ?? null,
        description: log.description,
        createdAt: log.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Admin audit logs error:", error);

    return NextResponse.json(
      { error: "Unable to load audit logs." },
      { status: 500 }
    );
  }
}