"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function WithdrawForm() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("/api/wallet/withdraw", {
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
        setMessage(data.error || "Withdrawal failed.");
        setSuccess(false);
        return;
      }

      setMessage(
        `Withdrawal successful. New balance: ${data.balance} BTC`
      );
      setSuccess(true);
      setAmount("");

      router.refresh();
    } catch (error) {
      console.error("Withdrawal error:", error);
      setMessage("Unable to connect to the server.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
      <h3 className="font-semibold text-white">
        Withdrawal
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Remove simulated BTC from your wallet.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="number"
          step="0.00000001"
          min="0.00000001"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Amount in BTC"
          required
          disabled={loading}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg border border-orange-500 px-5 py-3 font-semibold text-orange-400 transition hover:bg-orange-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing..." : "Withdraw BTC"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            success
              ? "border-green-500/20 bg-green-500/10 text-green-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}

