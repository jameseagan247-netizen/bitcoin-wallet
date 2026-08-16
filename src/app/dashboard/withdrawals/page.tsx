import DashboardNav from "../DashboardNav";
import WithdrawalsClient from "./WithdrawalsClient";

export default function WithdrawalsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <DashboardNav />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10">
          <p className="text-sm text-orange-400">
            Lucentra Ledger
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Withdrawals
          </h1>

          <p className="mt-3 text-slate-400">
            View your bank withdrawal requests and
            their current status.
          </p>
        </div>

        <WithdrawalsClient />
      </div>
    </main>
  );
}