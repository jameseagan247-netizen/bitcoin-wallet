import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import Link from "next/link";
import DashboardNav from "../DashboardNav";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function SecurityPage() {
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
      firstName: true,
      username: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <DashboardNav />

      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-orange-400 transition hover:text-orange-300"
          >
            ← Back to dashboard
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm text-orange-400">
            Account security
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Security
          </h1>

          <p className="mt-3 text-slate-400">
            Keep your Lucentra Ledger account secure,{" "}
            {user.firstName}.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <div>
            <h2 className="text-xl font-semibold">
              Change password
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Enter your current password and choose a new
              password for your account.
            </p>
          </div>

          <ChangePasswordForm />

          <div className="mt-8 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <p className="text-sm font-medium text-orange-400">
              Security notice
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              After changing your password, your current session
              will be ended and you will need to sign in again.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
