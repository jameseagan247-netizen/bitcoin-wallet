import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { getBitcoinPriceUsd } from "@/lib/bitcoinPrice";
import DashboardNav from "../DashboardNav";
import TransactionsClient from "./TransactionsClient";

export default async function TransactionsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    redirect("/login");
  }

  const userId = await verifySession(sessionToken);

  if (!userId) {
    redirect("/login");
  }

  const wallet = await prisma.wallet.findUnique({
    where: {
      userId,
    },
    include: {
      transactions: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!wallet) {
    redirect("/dashboard");
  }

  const bitcoinPriceUsd = await getBitcoinPriceUsd();

  const transactions = wallet.transactions.map((transaction) => ({
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount.toString(),
    description: transaction.description,
    status: transaction.status,
    createdAt: transaction.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <DashboardNav />

      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-orange-400 transition hover:text-orange-300"
          >
            ← Back to dashboard
          </Link>

          <p className="mt-6 text-sm text-orange-400">
            Lucentra Ledger
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Transactions
          </h1>

          <p className="mt-3 text-slate-400">
            View and search activity for your wallet.
          </p>
        </div>

        {bitcoinPriceUsd !== null && (
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-sm text-slate-500">
              Current BTC price
            </p>

            <p className="mt-1 text-xl font-bold text-white">
              $
              {bitcoinPriceUsd.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        )}

        <TransactionsClient
          transactions={transactions}
          bitcoinPriceUsd={bitcoinPriceUsd}
        />
      </div>
    </main>
  );
}