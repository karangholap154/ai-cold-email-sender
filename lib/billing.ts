import { toast } from "sonner";

export interface InitiateCheckoutOptions {
  onFallback?: () => void;
}

/**
 * Initiates the Dodo Payments Checkout session and redirects the user.
 * Reused across Draft, Log, and Settings views.
 */
export async function initiateCheckout(options?: InitiateCheckoutOptions): Promise<void> {
  try {
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to initiate checkout.");
    }

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    if (options?.onFallback) {
      options.onFallback();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to initiate checkout.";
    toast.error(message);
    if (options?.onFallback) {
      options.onFallback();
    }
    throw err;
  }
}
