const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPrice(value) {
  return ARS.format(Number(value) || 0);
}

export function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}
