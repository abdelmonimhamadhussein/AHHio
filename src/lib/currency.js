export function formatCurrency(value) {
  const amount = Number(value);
  const formattedAmount = (Number.isFinite(amount) ? amount : 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });

  return `${formattedAmount} SDG`;
}
