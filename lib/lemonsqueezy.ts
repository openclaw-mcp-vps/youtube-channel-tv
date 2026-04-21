export function getStripePaymentLink() {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "";
}

export function hasValidPaymentLink() {
  const value = getStripePaymentLink();
  return value.startsWith("https://") || value.startsWith("http://");
}
