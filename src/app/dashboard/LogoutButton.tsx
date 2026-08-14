"use client";

export default function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-red-400 hover:text-red-400"
    >
      Logout
    </button>
  );
}
