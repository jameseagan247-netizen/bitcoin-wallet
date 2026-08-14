"use client";

type UsdValueProps = {
  btcAmount: number;
  bitcoinPrice: number | null;
  prefix?: string;
};

export default function UsdValue({
  btcAmount,
  bitcoinPrice,
  prefix = "",
}: UsdValueProps) {
  if (bitcoinPrice === null) {
    return (
      <span className="text-slate-500">
        Unavailable
      </span>
    );
  }

  const usdValue = btcAmount * bitcoinPrice;

  return (
    <>
      {prefix}
      {usdValue.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </>
  );
}
