"use client";

import { useState } from "react";

export default function CreateWalletButton() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function createWallet() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/wallet/create", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Unable to create wallet.");
        return;
      }

      setMessage(data.message);
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        onClick={createWallet}
        disabled={loading}
        className="rounded-lg bg-orange-500 px-5 py-3 font-semibold hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? "Creating wallet..." : "Create wallet"}
      </button>

      {message && (
        <p className="mt-3 text-sm text-slate-400">
          {message}
        </p>
      )}
    </div>
  );
}