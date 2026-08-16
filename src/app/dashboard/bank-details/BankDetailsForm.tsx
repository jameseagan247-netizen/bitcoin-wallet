"use client";

import { FormEvent, useEffect, useState } from "react";

type BankAccount = {
  id: string;
  accountName: string;
  bankName: string;
  accountNumberLast4: string;
  country: string;
  verified: boolean;
};

export default function BankDetailsForm() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(
    []
  );

  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [country, setCountry] = useState("United Kingdom");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState("");

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function loadBankAccounts() {
    try {
      setLoading(true);

      const response = await fetch("/api/bank-accounts", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error || "Unable to load bank accounts."
        );
        return;
      }

      setBankAccounts(data.bankAccounts || []);
    } catch (error) {
      console.error("Bank account loading error:", error);

      setMessage(
        "Unable to load bank account information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBankAccounts();
  }, []);

  async function handleRemoveAccount(accountId: string) {
    if (removingId) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this bank account?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setSuccess(false);
    setRemovingId(accountId);

    try {
      const response = await fetch(
        `/api/bank-accounts?id=${encodeURIComponent(accountId)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error || "Unable to remove bank account."
        );
        return;
      }

      setSuccess(true);
      setMessage("Bank account removed successfully.");

      await loadBankAccounts();
    } catch (error) {
      console.error("Bank account removal error:", error);

      setMessage(
        "Unable to connect to the server."
      );
    } finally {
      setRemovingId("");
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setMessage("");
    setSuccess(false);

    if (!accountName.trim()) {
      setMessage("Enter the account holder name.");
      return;
    }

    if (!bankName.trim()) {
      setMessage("Enter the bank name.");
      return;
    }

    const cleanedAccountNumber =
      accountNumber.replace(/\s+/g, "");

    if (!/^\d{4,}$/.test(cleanedAccountNumber)) {
      setMessage(
        "Enter a valid bank account number."
      );
      return;
    }

    if (!country.trim()) {
      setMessage("Enter the country.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountName,
          bankName,
          accountNumber,
          country,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error || "Unable to add bank account."
        );
        return;
      }

      setSuccess(true);
      setMessage("Bank account added successfully.");

      setAccountName("");
      setBankName("");
      setAccountNumber("");

      await loadBankAccounts();
    } catch (error) {
      console.error("Bank account creation error:", error);

      setMessage(
        "Unable to connect to the server."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Existing accounts */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold text-white">
          Your bank accounts
        </h2>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">
            Loading bank accounts...
          </p>
        ) : bankAccounts.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No bank accounts have been added yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {bankAccounts.map((account) => (
              <div
                key={account.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">
                        {account.bankName}
                      </p>

                      {account.verified && (
                        <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-1 text-xs text-green-400">
                          Verified
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-400">
                      {account.accountName}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Account ending in{" "}
                      <span className="text-slate-300">
                        {account.accountNumberLast4}
                      </span>
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {account.country}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveAccount(account.id)
                    }
                    disabled={removingId === account.id}
                    className="w-full rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {removingId === account.id
                      ? "Removing..."
                      : "Remove"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add account */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold text-white">
          Add bank account
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Add a bank account to use for withdrawals.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >
          <div>
            <label
              htmlFor="accountName"
              className="mb-2 block text-sm text-slate-400"
            >
              Account holder name
            </label>

            <input
              id="accountName"
              type="text"
              value={accountName}
              onChange={(event) =>
                setAccountName(event.target.value)
              }
              placeholder="John Smith"
              disabled={saving}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-orange-500"
            />
          </div>

          <div>
            <label
              htmlFor="bankName"
              className="mb-2 block text-sm text-slate-400"
            >
              Bank name
            </label>

            <input
              id="bankName"
              type="text"
              value={bankName}
              onChange={(event) =>
                setBankName(event.target.value)
              }
              placeholder="Example Bank"
              disabled={saving}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-orange-500"
            />
          </div>

          <div>
            <label
              htmlFor="accountNumber"
              className="mb-2 block text-sm text-slate-400"
            >
              Bank account number
            </label>

            <input
              id="accountNumber"
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(event) =>
                setAccountNumber(event.target.value)
              }
              placeholder="Enter account number"
              disabled={saving}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-orange-500"
            />

            <p className="mt-2 text-xs text-slate-600">
              For security, only the last four
              digits are retained.
            </p>
          </div>

          <div>
            <label
              htmlFor="country"
              className="mb-2 block text-sm text-slate-400"
            >
              Country
            </label>

            <input
              id="country"
              type="text"
              value={country}
              onChange={(event) =>
                setCountry(event.target.value)
              }
              disabled={saving}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Adding account..."
              : "Add bank account"}
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
    </div>
  );
}