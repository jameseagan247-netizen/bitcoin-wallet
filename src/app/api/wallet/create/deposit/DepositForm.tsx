"use client";

import { FormEvent, useState } from "react";

export default function DepositForm() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Deposit failed.");
        return;
      }

      setMessage(`Deposit successful. New balance: ${data.balance} BTC`);
      setAmount("");

      window.location.reload();
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
      <h3 className="font-semibold">
        Deposit
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Add BTC to your wallet.
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
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-orange-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-orange-500 px-5 py-3 font-semibold hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add BTC"}
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