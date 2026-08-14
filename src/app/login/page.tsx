"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to sign in.");
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-md">

        <div className="mb-8 text-center">
          <a
            href="/"
            className="text-sm text-slate-400 hover:text-white"
          >
            ← Back to home
          </a>

          <h1 className="mt-8 text-3xl font-bold">
            Welcome back
          </h1>

          <p className="mt-3 text-slate-400">
            Sign in to your Bitcoin wallet.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-8"
        >

          <div>
            <label className="mb-2 block text-sm font-medium">
              Email address
            </label>

            <input
              type="email"
              name="email"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-orange-500"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              name="password"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-orange-500"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 px-5 py-3.5 font-semibold hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {message && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <p className="text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-orange-400 hover:text-orange-300"
            >
              Create one
            </a>
          </p>

        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          
        </p>

      </div>
    </main>
  );
}