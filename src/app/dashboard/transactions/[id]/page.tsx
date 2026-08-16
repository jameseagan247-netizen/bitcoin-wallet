import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { getBitcoinPriceUsd } from "@/lib/bitcoinPrice";
import DashboardNav from "../../DashboardNav";

type TransactionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TransactionDetailsPage({
  params,
}: TransactionPageProps) {
  const { id } = await params;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    redirect("/login");
  }

  const userId = await verifySession(sessionToken);

  if (!userId) {
    redirect("/login");
  }

  const transaction = await prisma.transaction.findFirst({
    where: {
      id,
      wallet: {
        userId,
      },
    },
    include: {
      wallet: {
        select: {
          balance: true,
          userId: true,
        },
      },
    },
  });

  if (!transaction) {
    notFound();
  }

  const bitcoinPriceUsd = await getBitcoinPriceUsd();

  const amountBtc = Number(transaction.amount);

  const amountUsd =
    bitcoinPriceUsd !== null
      ? amountBtc * bitcoinPriceUsd
      : null;

  const isDeposit = transaction.type === "DEPOSIT";

  const status = transaction.status.toUpperCase();

  const statusClasses =
    status === "COMPLETED"
      ? "border-green-500/20 bg-green-500/10 text-green-400"
      : status === "FAILED"
        ? "border-red-500/20 bg-red-500/10 text-red-400"
        : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

  const statusLabel =
    status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <DashboardNav />

        <div className="mb-8">
          <Link
            href="/dashboard/transactions"
            className="text-sm text-orange-400 transition hover:text-orange-300"
          >
            ← Back to transactions
          </Link>

          <p className="mt-6 text-sm text-orange-400">
            Lucentra Ledger
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Transaction details
          </h1>

          <p className="mt-3 text-slate-400">
            Review the details of this wallet transaction.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={
                    isDeposit
                      ? "rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400"
                      : "rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400"
                  }
                >
                  {isDeposit ? "DEPOSIT" : "WITHDRAWAL"}
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClasses}`}
                >
                  {statusLabel}
                </span>
              </div>

              <h2 className="mt-5 text-3xl font-bold">
                {isDeposit ? "+" : "-"}
                {amountBtc.toFixed(8)} BTC
              </h2>

              {amountUsd !== null && (
                <p
                  className={
                    isDeposit
                      ? "mt-2 text-lg text-green-400"
                      : "mt-2 text-lg text-red-400"
                  }
                >
                  {isDeposit ? "+" : "-"}$
                  {amountUsd.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs uppercase tracking-wide text-slate-600">
                Date
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {transaction.createdAt.toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 border-t border-slate-800 pt-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-600">
                Transaction ID
              </p>

              <p className="mt-2 break-all text-sm text-slate-300">
                {transaction.id}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-600">
                Transaction type
              </p>

              <p className="mt-2 text-sm text-slate-300">
                {transaction.type}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-600">
                Status
              </p>

              <p className="mt-2 text-sm text-slate-300">
                {statusLabel}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-600">
                Created
              </p>

              <p className="mt-2 text-sm text-slate-300">
                {transaction.createdAt.toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-800 pt-6">
            <p className="text-xs uppercase tracking-wide text-slate-600">
              Description
            </p>

            <p className="mt-2 text-sm text-slate-300">
              {transaction.description || "No description provided."}
            </p>
          </div>

          {bitcoinPriceUsd !== null && (
            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-600">
                Current BTC/USD reference
              </p>

              <p className="mt-1 text-sm text-slate-300">
                $
                {bitcoinPriceUsd.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          )}

          {status === "PENDING" && (
            <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="text-sm text-yellow-400">
                This transaction is currently pending.
              </p>
            </div>
          )}

          {status === "COMPLETED" && (
            <div className="mt-6 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <p className="text-sm text-green-400">
                This transaction has been completed successfully.
              </p>
            </div>
          )}

          {status === "FAILED" && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-400">
                This transaction could not be completed.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
