"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function DepositForm() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setMessage("Please enter a valid BTC amount.");
      return;
    }

    if (numericAmount > 10) {
      setMessage("Maximum deposit is 10 BTC.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: numericAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Deposit failed.");
      }

      setAmount("");
      setMessage("Deposit successful.");

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
      <h3 className="text-lg font-semibold text-white">
        Deposit Bitcoin
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Add BTC to your training wallet.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="number"
          step="0.00000001"
          min="0.00000001"
          max="10"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Amount in BTC"
          required
          disabled={loading}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-orange-500 px-5 py-3 font-medium text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Depositing..." : "Deposit"}
        </button>
      </form>

      {message && (
        <p className="mt-3 text-sm text-slate-400">
          {message}
        </p>
      )}
    </div>
  );
}
