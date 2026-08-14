"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);

    router.refresh();

    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={refreshing}
      className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-orange-400 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {refreshing ? "Refreshing..." : "Refresh"}
    </button>
  );
}