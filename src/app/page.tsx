export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
        
        <header className="flex items-center justify-between py-6">
          <div className="text-xl font-bold">
            Lucentra Ledger & CMC
          </div>

          <div className="flex gap-3">
            <a
              href="/login"
              className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium hover:bg-slate-800"
            >
              Login
            </a>

            <a
              href="/register"
              className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600"
            >
              Register
            </a>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-20">
          <div className="max-w-3xl text-center">
            
            <div className="mb-6 inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-400">
              Lucentra Ledger and CMC
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Bitcoin & ETH
              <span className="block text-orange-500">
                Lucentra Ledger.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              View your Bitcoin Portfolio , Create purchase orders and Withdraw your funds
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="/register"
                className="rounded-xl bg-orange-500 px-8 py-4 font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600"
              >
                Create an account
              </a>

              <a
                href="/login"
                className="rounded-xl border border-slate-700 px-8 py-4 font-semibold text-white hover:bg-slate-800"
              >
                Sign in
              </a>
            </div>

            <div className="mt-16 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="text-3xl">₿</div>
                <h2 className="mt-3 font-semibold">
                  Buy
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Bitcoin.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="text-3xl">⚡</div>
                <h2 className="mt-3 font-semibold">
                  Lightning
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Lightning Invoices
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="text-3xl">🛡️</div>
                <h2 className="mt-3 font-semibold">
                  Buy
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  ETH.
                </p>
              </div>
            </div>

          </div>
        </section>

        <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
          Bitcoin Etherium
        </footer>

      </div>
    </main>
  );
}