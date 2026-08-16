import DashboardNav from "../DashboardNav";
import BankDetailsForm from "./BankDetailsForm";

export default function BankDetailsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <DashboardNav />

      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <p className="text-sm text-orange-400">
            Lucentra Ledger
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Bank Details
          </h1>

          <p className="mt-3 text-slate-400">
            Add a bank account for withdrawals.
          </p>
        </div>

        <BankDetailsForm />
      </div>
    </main>
  );
}