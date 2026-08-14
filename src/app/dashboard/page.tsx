import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { getBitcoinPriceUsd } from "@/lib/bitcoinPrice";
import DepositForm from "./DepositForm";
import WithdrawForm from "./WithdrawForm";
import DashboardNav from "./DashboardNav";
import WalletAddress from "./WalletAddress";
import BtcChart from "./BtcChart";
import DashboardLivePrice from "./DashboardLivePrice";

export default async function DashboardPage() {
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
      lastName: true,
      username: true,
      email: true,
      country: true,
    },
  });

  if (!user) {
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

  const balanceBtc = Number(wallet.balance);

  const totalDeposits = wallet.transactions
    .filter(
      (transaction) => transaction.type === "DEPOSIT"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    );
  const totalWithdrawals = wallet.transactions
    .filter(
      (transaction) => transaction.type === "WITHDRAWAL"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    );

  const transactionCount =
    wallet.transactions.length;

  const latestTransaction =
    wallet.transactions[0];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <DashboardNav />

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-10">
          <p className="text-sm text-orange-400">
            Lucentra Ledger
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Welcome, {user.firstName}!
          </h1>

          <p className="mt-3 text-slate-400">
            Your wallet dashboard.
          </p>
        </div>

        {/* Account + Wallet */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Account */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Account
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <p>
                <span className="text-slate-500">
                  Name:
                </span>{" "}
                {user.firstName} {user.lastName}
              </p>

              <p>
                <span className="text-slate-500">
                  Username:
                </span>{" "}
                {user.username}
              </p>

              <p>
                <span className="text-slate-500">
                  Email:
                </span>{" "}
                {user.email}
              </p>

              <p>
                <span className="text-slate-500">
                  Country:
                </span>{" "}
                {user.country}
              </p>
            </div>
          </div>

          {/* Wallet */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Wallet
            </h2>

            <p className="mt-3 text-slate-400">
              Your Wallet.
            </p>

            <DashboardLivePrice
              initialPrice={bitcoinPriceUsd}
              balanceBtc={balanceBtc}
              totalDeposits={totalDeposits}
              totalWithdrawals={totalWithdrawals}
              latestTransaction={
                latestTransaction
                  ? {
                      type: latestTransaction.type,
                      amount: Number(
                        latestTransaction.amount
                      ),
                    }
                  : null
              }
            />

            <WalletAddress
              address={wallet.address}
            />

            <div className="mt-6">
              <DepositForm />
            </div>

            <div className="mt-4">
              <WithdrawForm />
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Deposits */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">
              Total deposits
            </p>

            <p className="mt-2 text-xl font-semibold text-green-400">
              +{totalDeposits.toFixed(8)} BTC
            </p>

            <DashboardLivePrice
              initialPrice={bitcoinPriceUsd}
              balanceBtc={0}
              totalDeposits={totalDeposits}
              totalWithdrawals={0}
              latestTransaction={null}
              compact="deposits"
            />
          </div>

          {/* Withdrawals */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">
              Total withdrawals
            </p>

            <p className="mt-2 text-xl font-semibold text-red-400">
              -{totalWithdrawals.toFixed(8)} BTC
            </p>

            <DashboardLivePrice
              initialPrice={bitcoinPriceUsd}
              balanceBtc={0}
              totalDeposits={0}
              totalWithdrawals={
                totalWithdrawals
              }
              latestTransaction={null}
              compact="withdrawals"
            />
          </div>

          {/* Portfolio */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">
              Portfolio value
            </p>

            <DashboardLivePrice
              initialPrice={bitcoinPriceUsd}
              balanceBtc={balanceBtc}
              totalDeposits={0}
              totalWithdrawals={0}
              latestTransaction={null}
              compact="portfolio"
            />

            <p className="mt-1 text-sm text-slate-500">
              {wallet.balance.toString()} BTC
            </p>
          </div>

          {/* Transaction count */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">
              Transactions
            </p>

            <p className="mt-2 text-xl font-semibold">
              {transactionCount}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Total wallet activity
            </p>
          </div>
        </div>

        {/* Bitcoin Market */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5">
            <p className="text-sm text-orange-400">
              Bitcoin market
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              BTC / USD
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Bitcoin price movement over the last
              7 days.
            </p>
          </div>

          <BtcChart />
        </div>

        {/* Latest Activity */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Latest activity
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Your most recent wallet transaction.
              </p>
            </div>

            <a
              href="/dashboard/transactions"
              className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-sm text-orange-400 transition hover:border-orange-400 hover:bg-orange-400/10 hover:text-orange-300"
            >
              View all
            </a>
          </div>

          {!latestTransaction ? (
            <div className="mt-6 rounded-xl bg-slate-950 p-6 text-center">
              <p className="text-slate-400">
                No transactions yet.
              </p>
            </div>
          ) : (
            <a
              href={`/dashboard/transactions/${latestTransaction.id}`}
              className="mt-6 block rounded-xl border border-slate-800 bg-slate-950 p-5 transition hover:border-orange-400 hover:bg-slate-900"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={
                        latestTransaction.type ===
                        "DEPOSIT"
                          ? "rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400"
                          : "rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400"
                      }
                    >
                      {latestTransaction.type}
                    </span>

                    <span className="font-medium">
                      {latestTransaction.description ||
                        (latestTransaction.type ===
                        "DEPOSIT"
                          ? "deposit"
                          : "withdrawal")}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {latestTransaction.createdAt.toLocaleString()}
                  </p>
                </div>

                <DashboardLivePrice
                  initialPrice={bitcoinPriceUsd}
                  balanceBtc={0}
                  totalDeposits={0}
                  totalWithdrawals={0}
                  latestTransaction={{
                    type: latestTransaction.type,
                    amount: Number(
                      latestTransaction.amount
                    ),
                  }}
                  compact="transaction"
                />
              </div>
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
