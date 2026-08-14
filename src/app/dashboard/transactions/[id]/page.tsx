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

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <DashboardNav />

        <div className="mb-6">
          <Link
            href="/dashboard/transactions"
            className="text-sm text-orange-400 transition hover:text-orange-300"
          >
            ← Back to transactions
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-orange-400">
                Transaction details
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                {isDeposit ? "Deposit" : "Withdrawal"}
              </h1>

              <p className="mt-2 break-all text-sm text-slate-500">
                ID: {transaction.id}
              </p>
            </div>

            <span
              className={
                isDeposit
                  ? "w-fit rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-400"
                  : "w-fit rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-400"
              }
            >
              {transaction.type}
            </span>
          </div>

          {/* Transaction information */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">

            {/* BTC Amount */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-500">
                Amount
              </p>

              <p
                className={
                  isDeposit
                    ? "mt-2 text-2xl font-bold text-green-400"
                    : "mt-2 text-2xl font-bold text-red-400"
                }
              >
                {isDeposit ? "+" : "-"}
                {transaction.amount.toString()} BTC
              </p>
            </div>

            {/* USD Value */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-500">
                Current USD value
              </p>

              {amountUsd !== null ? (
                <>
                  <p
                    className={
                      isDeposit
                        ? "mt-2 text-2xl font-bold text-green-400"
                        : "mt-2 text-2xl font-bold text-red-400"
                    }
                  >
                    {isDeposit ? "+" : "-"}$
                    {amountUsd.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Based on current BTC price
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  USD value unavailable
                </p>
              )}
            </div>

            {/* Status */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-500">
                Status
              </p>

              <p className="mt-2 text-2xl font-bold text-green-400">
                {transaction.status}
              </p>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-500">
                Description
              </p>

              <p className="mt-2 font-medium">
                {transaction.description || "No description"}
              </p>
            </div>

            {/* Date */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-500">
                Date
              </p>

              <p className="mt-2 font-medium">
                {transaction.createdAt.toLocaleString()}
              </p>
            </div>

            {/* BTC price */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-500">
                Current BTC price
              </p>

              {bitcoinPriceUsd !== null ? (
                <p className="mt-2 text-xl font-bold">
                  $
                  {bitcoinPriceUsd.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Price unavailable
                </p>
              )}
            </div>
          </div>

          {/* Current wallet balance */}
          <div className="mt-6 rounded-xl border border-orange-500/20 bg-orange-500/5 p-5">
            <p className="text-sm text-slate-500">
              Current wallet balance
            </p>

            <p className="mt-2 text-2xl font-bold">
              {transaction.wallet.balance.toString()} BTC
            </p>

            {bitcoinPriceUsd !== null && (
              <p className="mt-2 text-lg text-slate-400">
                ≈ $
                {(
                  Number(transaction.wallet.balance) *
                  bitcoinPriceUsd
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USD
              </p>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}