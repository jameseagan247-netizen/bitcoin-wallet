"use client";

import { useState } from "react";

type WalletAddressProps = {
  address: string;
};

export default function WalletAddress({
  address,
}: WalletAddressProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">
             wallet address
          </p>

          <p className="mt-1 text-xs text-slate-500">
            
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
        <p className="break-all font-mono text-sm text-slate-300">
          {address}
        </p>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 w-full rounded-lg border border-orange-500 px-4 py-3 text-sm font-semibold text-orange-400 transition hover:bg-orange-500 hover:text-white"
      >
        {copied ? "Copied!" : "Copy address"}
      </button>
    </div>
  );
}
