// This project currently uses Stripe Payment Links for checkout.
// This helper file remains intentionally named for architecture compatibility.

export function getCheckoutLink() {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "";
}

export function isCheckoutConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK);
}
