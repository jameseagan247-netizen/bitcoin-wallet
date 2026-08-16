"use client";

import { useEffect, useState } from "react";

type Client = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  createdAt: string;
  wallet: {
    id: string;
    balance: string;
  } | null;
};

type AuditLog = {
  id: string;
  actorUserId: string;
  actorUsername: string;
  targetUserId: string;
  targetUsername: string;
  action: string;
  amount: string | null;
  previousBalance: string | null;
  newBalance: string | null;
  description: string | null;
  createdAt: string;
};

export default function AdminClient() {
  const [clients, setClients] = useState<Client[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState("");

  const [selectedClientId, setSelectedClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadClients() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/clients", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to load clients.");
        return;
      }

      setClients(data.clients || []);
    } catch (error) {
      console.error("Admin client loading error:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAuditLogs() {
    try {
      setAuditLoading(true);
      setAuditError("");

      const response = await fetch("/api/admin/audit-logs", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setAuditError(
          data.error || "Unable to load audit logs."
        );
        return;
      }

      setAuditLogs(data.auditLogs || []);
    } catch (error) {
      console.error("Admin audit log loading error:", error);
      setAuditError("Unable to connect to the server.");
    } finally {
      setAuditLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
    loadAuditLogs();
  }, []);

  async function creditBitcoin(event: React.FormEvent) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!selectedClientId) {
      setError("Please select a client.");
      return;
    }

    if (!amount.trim()) {
      setError("Please enter a BTC amount.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        "/api/admin/wallets/credit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: selectedClientId,
            amount: amount.trim(),
            description: description.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Unable to credit BTC."
        );
        return;
      }

      setMessage(
        `Successfully credited ${data.amount} BTC to ${data.username}. New balance: ${data.balance} BTC.`
      );

      setAmount("");
      setDescription("");

      await loadClients();
      await loadAuditLogs();
    } catch (error) {
      console.error("BTC credit error:", error);
      setError("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedClient = clients.find(
    (client) => client.id === selectedClientId
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          Loading clients...
        </p>
      </div>
    );
  }

  if (error && clients.length === 0) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
        <p className="text-sm text-red-400">{error}</p>

        <button
          type="button"
          onClick={loadClients}
          className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Credit BTC */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">
          Credit BTC
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Add BTC to a client's wallet and create a
          corresponding transaction record.
        </p>

        <form
          onSubmit={creditBitcoin}
          className="mt-6 space-y-5"
        >
          <div>
            <label
              htmlFor="client"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Client
            </label>

            <select
              id="client"
              value={selectedClientId}
              onChange={(event) =>
                setSelectedClientId(event.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-orange-400"
            >
              <option value="">
                Select a client
              </option>

              {clients.map((client) => (
                <option
                  key={client.id}
                  value={client.id}
                >
                  {client.username} —{" "}
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
          </div>

          {selectedClient && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-600">
                Current balance
              </p>

              <p className="mt-1 text-2xl font-semibold text-white">
                {selectedClient.wallet?.balance ||
                  "0.00000000"}{" "}
                BTC
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {selectedClient.email}
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="amount"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              BTC amount
            </label>

            <input
              id="amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
              placeholder="0.01000000"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-orange-400"
            />

            <p className="mt-2 text-xs text-slate-600">
              Maximum 8 decimal places.
            </p>
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Note
            </label>

            <input
              id="description"
              type="text"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Optional credit note"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-orange-400"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">
                {error}
              </p>
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3">
              <p className="text-sm text-green-400">
                {message}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Crediting BTC..."
              : "Credit BTC"}
          </button>
        </form>
      </section>

      {/* Clients */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            Clients
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {clients.length}{" "}
            {clients.length === 1
              ? "client"
              : "clients"}
          </p>
        </div>

        <div className="space-y-3">
          {clients.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() =>
                setSelectedClientId(client.id)
              }
              className={`w-full rounded-2xl border bg-slate-900 p-5 text-left transition ${
                selectedClientId === client.id
                  ? "border-orange-400"
                  : "border-slate-800 hover:border-slate-600"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-white">
                    {client.username}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {client.firstName}{" "}
                    {client.lastName}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    {client.email}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs uppercase tracking-wide text-slate-600">
                    Wallet balance
                  </p>

                  <p className="mt-1 font-semibold text-orange-400">
                    {client.wallet?.balance ||
                      "0.00000000"}{" "}
                    BTC
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Audit Log */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            Audit Log
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Administrative wallet changes and account activity.
          </p>
        </div>

        {auditLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Loading audit log...
            </p>
          </div>
        ) : auditError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
            <p className="text-sm text-red-400">
              {auditError}
            </p>

            <button
              type="button"
              onClick={loadAuditLogs}
              className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-500">
              No administrative actions have been recorded yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400">
                        {log.action}
                      </span>

                      <span className="text-xs text-slate-600">
                        {new Date(
                          log.createdAt
                        ).toLocaleString()}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-300">
                      <span className="text-slate-500">
                        Admin:
                      </span>{" "}
                      {log.actorUsername}
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      <span className="text-slate-500">
                        Client:
                      </span>{" "}
                      {log.targetUsername}
                    </p>

                    {log.description && (
                      <p className="mt-2 text-sm text-slate-400">
                        <span className="text-slate-500">
                          Note:
                        </span>{" "}
                        {log.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                    <div className="rounded-xl bg-slate-950 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-600">
                        Amount
                      </p>

                      <p className="mt-1 font-semibold text-white">
                        {log.amount ?? "—"} BTC
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-600">
                        Before
                      </p>

                      <p className="mt-1 font-semibold text-white">
                        {log.previousBalance ?? "—"} BTC
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-600">
                        After
                      </p>

                      <p className="mt-1 font-semibold text-orange-400">
                        {log.newBalance ?? "—"} BTC
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
            {/* Audit Log */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            Audit Log
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Administrative wallet changes and account activity.
          </p>
        </div>

        {auditLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Loading audit logs...
            </p>
          </div>
        ) : auditError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
            <p className="text-sm text-red-400">
              {auditError}
            </p>

            <button
              type="button"
              onClick={loadAuditLogs}
              className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              No administrative activity has been recorded yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
                        {log.action.replaceAll("_", " ")}
                      </span>

                      <span className="text-xs text-slate-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-300">
                      Admin{" "}
                      <span className="font-semibold text-white">
                        {log.actorUsername}
                      </span>{" "}
                      changed client{" "}
                      <span className="font-semibold text-white">
                        {log.targetUsername}
                      </span>
                    </p>

                    {log.description && (
                      <p className="mt-2 text-sm text-slate-500">
                        Note: {log.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                    <div className="rounded-xl bg-slate-950 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-600">
                        Amount
                      </p>

                      <p className="mt-1 font-semibold text-orange-400">
                        {log.amount || "—"} BTC
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-600">
                        Before
                      </p>

                      <p className="mt-1 font-semibold text-white">
                        {log.previousBalance || "—"} BTC
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-600">
                        After
                      </p>

                      <p className="mt-1 font-semibold text-green-400">
                        {log.newBalance || "—"} BTC
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
