const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export async function createCheckoutSession(
  priceId: string,
  userId: string,
  mode: "payment" | "subscription"
): Promise<void> {
  const res = await fetch(`${API_BASE}/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ price_id: priceId, user_id: userId, mode }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Checkout failed");
  }

  const { url } = await res.json();
  window.location.href = url;
}
