"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BankAccount = {
  id: string;
  accountName: string;
  bankName: string;
  accountNumberLast4: string;
  country: string;
  verified: boolean;
};

type WithdrawFormProps = {
  balanceBtc: string;
  bitcoinPriceUsd: number | null;
};

export default function WithdrawForm({
  balanceBtc,
  bitcoinPriceUsd,
}: WithdrawFormProps) {
  const router = useRouter();

  const [amountUsd, setAmountUsd] = useState("");
  const [bankAccounts, setBankAccounts] = useState<
    BankAccount[]
  >([]);
  const [selectedBankAccount, setSelectedBankAccount] =
    useState("");

  const [loadingAccounts, setLoadingAccounts] =
    useState(true);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const balanceBtcNumber = Number(balanceBtc);

  const availableUsd =
    bitcoinPriceUsd !== null
      ? balanceBtcNumber * bitcoinPriceUsd
      : 0;

  useEffect(() => {
    async function loadBankAccounts() {
      try {
        const response = await fetch(
          "/api/bank-accounts"
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(
            data.error ||
              "Unable to load bank account."
          );
          return;
        }

        setBankAccounts(
  (data.bankAccounts || []).filter(
    (account: BankAccount) =>
      account.verified
  )
);

        if (data.bankAccounts?.length > 0) {
          setSelectedBankAccount(
            data.bankAccounts[0].id
          );
        }
      } catch (error) {
        console.error(
          "Bank account loading error:",
          error
        );

        setMessage(
          "Unable to load bank account information."
        );
      } finally {
        setLoadingAccounts(false);
      }
    }

    loadBankAccounts();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const requestedUsd = Number(amountUsd);

    if (
      !Number.isFinite(requestedUsd) ||
      requestedUsd <= 0
    ) {
      setMessage(
        "Enter a valid withdrawal amount."
      );
      return;
    }

    if (requestedUsd > availableUsd) {
      setMessage(
        "The withdrawal amount cannot exceed your available balance."
      );
      return;
    }

    if (!selectedBankAccount) {
      setMessage(
        "Please select a bank account."
      );
      return;
    }

    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch(
        "/api/wallet/withdraw",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usdAmount: amountUsd,
            bankAccountId: selectedBankAccount,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error || "Withdrawal failed."
        );
        setSuccess(false);
        return;
      }

      setMessage(
        `Withdrawal request submitted for $${requestedUsd.toFixed(
          2
        )}. Status: ${data.status}.`
      );

      setSuccess(true);
      setAmountUsd("");

      router.refresh();
    } catch (error) {
      console.error(
        "Withdrawal error:",
        error
      );

      setMessage(
        "Unable to connect to the server."
      );

      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  const hasBankAccount =
    bankAccounts.length > 0;

  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
      <h3 className="font-semibold text-white">
        Withdraw to Bank
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Withdraw your available balance to your
        verified bank account.
      </p>

      {/* Available balance */}
      <div className="mt-5 rounded-lg border border-slate-800 bg-slate-900 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Available balance
        </p>

        <p className="mt-1 text-2xl font-semibold text-white">
          {bitcoinPriceUsd === null
            ? "Unavailable"
            : `$${availableUsd.toFixed(2)}`}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Available for withdrawal
        </p>
      </div>

      {bitcoinPriceUsd === null ? (
        <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-400">
          The current BTC/USD rate is temporarily
          unavailable. Please try again shortly.
        </div>
      ) : loadingAccounts ? (
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
          Loading bank account...
        </div>
      ) : !hasBankAccount ? (
        <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-400">
          No verified bank account is available
          for withdrawal.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-4"
        >
          {/* Bank account */}
          <div>
            <label
              htmlFor="bankAccount"
              className="mb-2 block text-sm text-slate-400"
            >
              Bank account
            </label>

            <select
              id="bankAccount"
              value={selectedBankAccount}
              onChange={(event) =>
                setSelectedBankAccount(
                  event.target.value
                )
              }
              disabled={loading}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bankAccounts.map((account) => (
                <option
                  key={account.id}
                  value={account.id}
                >
                  {account.bankName} ••••{" "}
                  {account.accountNumberLast4}
                </option>
              ))}
            </select>

            {selectedBankAccount && (
              <p className="mt-2 text-xs text-slate-500">
                {
                  bankAccounts.find(
                    (account) =>
                      account.id ===
                      selectedBankAccount
                  )?.accountName
                }
              </p>
            )}
          </div>

          {/* USD amount */}
          <div>
            <label
              htmlFor="withdrawAmount"
              className="mb-2 block text-sm text-slate-400"
            >
              Withdrawal amount
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                $
              </span>

              <input
                id="withdrawAmount"
                type="number"
                step="0.01"
                min="0.01"
                max={availableUsd}
                value={amountUsd}
                onChange={(event) =>
                  setAmountUsd(event.target.value)
                }
                placeholder="0.00"
                required
                disabled={loading}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 pl-8 text-white outline-none placeholder:text-slate-600 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Maximum available: $
              {availableUsd.toFixed(2)}
            </p>
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              !selectedBankAccount ||
              bitcoinPriceUsd === null ||
              Number(amountUsd) <= 0 ||
              Number(amountUsd) > availableUsd
            }
            className="w-full rounded-lg border border-orange-500 px-5 py-3 font-semibold text-orange-400 transition hover:bg-orange-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Request Withdrawal"}
          </button>
        </form>
      )}

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
