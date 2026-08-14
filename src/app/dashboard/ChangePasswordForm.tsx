"use client";

import { FormEvent, useState } from "react";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to change password.");
        return;
      }

      setMessage(data.message);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 space-y-4"
    >
      <div>
        <label
          htmlFor="currentPassword"
          className="mb-2 block text-sm text-slate-400"
        >
          Current password
        </label>

        <input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-orange-400"
        />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="mb-2 block text-sm text-slate-400"
        >
          New password
        </label>

        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-orange-400"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm text-slate-400"
        >
          Confirm new password
        </label>

        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-orange-400"
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {message && (
        <p className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-orange-500 px-5 py-3 font-medium text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Changing password..." : "Change password"}
      </button>
    </form>
  );
}