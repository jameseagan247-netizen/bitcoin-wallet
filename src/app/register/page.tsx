"use client";

import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const country = formData.get("country") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          email,
          country,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to create account.");
        return;
      }

      setMessage("Account created successfully!");

      form.reset();
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
            Create your account
          </h1>

          <p className="mt-3 text-slate-400">
            Create an account for your Bitcoin wallet.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-8"
        >

          <div className="grid gap-5 sm:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium">
                First name
              </label>

              <input
                type="text"
                name="firstName"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-orange-500"
                placeholder="John"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Last name
              </label>

              <input
                type="text"
                name="lastName"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-orange-500"
                placeholder="Smith"
              />
            </div>

          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Username
            </label>

            <input
              type="text"
              name="username"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-orange-500"
              placeholder="johnsmith"
            />
          </div>

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
              Country
            </label>

            <select
              name="country"
              required
              defaultValue=""
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-orange-500"
            >
              <option value="" disabled>
                Select your country
              </option>

              <option value="Canada">Canada</option>
              <option value="United States">United States</option>
              <option value="Australia">Australia</option>
              <option value="New Zealand">New Zealand</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-orange-500"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Confirm password
            </label>

            <input
              type="password"
              name="confirmPassword"
              required
              minLength={8}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-orange-500"
              placeholder="Enter your password again"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 px-5 py-3.5 font-semibold hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
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
            Already have an account?{" "}
            <a
              href="/login"
              className="text-orange-400 hover:text-orange-300"
            >
              Sign in
            </a>
          </p>

        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          
        </p>

      </div>
    </main>
  );
}