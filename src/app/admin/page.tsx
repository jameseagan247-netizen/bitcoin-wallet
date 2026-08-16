import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    redirect("/login");
  }

  const userId = await verifySession(sessionToken);

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      role: true,
      username: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="text-sm text-orange-400">
            Lucentra Ledger
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Admin Dashboard
          </h1>

          <p className="mt-3 text-slate-400">
            Manage client wallets and account activity.
          </p>
        </div>

        <AdminClient />
      </div>
    </main>
  );
}
