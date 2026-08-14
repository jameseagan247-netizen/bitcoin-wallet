"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordForm() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Unable to change password.");
        return;
      }

      setSuccess(true);
      setMessage(data.message);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-5"
    >
      <div>
        <label
          htmlFor="currentPassword"
          className="text-sm text-slate-400"
        >
          Current password
        </label>

        <input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(event) =>
            setCurrentPassword(event.target.value)
          }
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-orange-500"
        />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="text-sm text-slate-400"
        >
          New password
        </label>

        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(event) =>
            setNewPassword(event.target.value)
          }
          autoComplete="new-password"
          minLength={8}
          required
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-orange-500"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="text-sm text-slate-400"
        >
          Confirm new password
        </label>

        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(event.target.value)
          }
          autoComplete="new-password"
          minLength={8}
          required
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-orange-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-orange-500 px-5 py-3 font-semibold transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Changing password..." : "Change password"}
      </button>

      {message && (
        <p
          className={
            success
              ? "text-sm text-green-400"
              : "text-sm text-red-400"
          }
        >
          {message}
        </p>
      )}
    </form>
  );
}
