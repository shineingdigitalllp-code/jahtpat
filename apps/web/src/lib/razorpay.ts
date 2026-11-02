import type { PaymentMethod } from "@jhatpat/shared";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpaySuccess = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: "INR";
  name: string;
  description: string;
  prefill: { method: Exclude<PaymentMethod, "cod"> };
  theme: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void; on: (event: "payment.failed", cb: () => void) => void };
  }
}

let loader: Promise<void> | null = null;

const loadCheckout = () => {
  loader ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve();
    script.onerror = () => {
      loader = null;
      reject(new Error("Could not load payment gateway. Check your connection."));
    };
    document.body.appendChild(script);
  });
  return loader;
};

type PayOptions = {
  keyId: string;
  orderId: string;
  amountPaise: number;
  orderCode: string;
  method: Exclude<PaymentMethod, "cod">;
};

export async function payWithRazorpay({ keyId, orderId, amountPaise, orderCode, method }: PayOptions) {
  await loadCheckout();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Could not load payment gateway. Check your connection.");

  return new Promise<RazorpaySuccess>((resolve, reject) => {
    const checkout = new Razorpay({
      key: keyId,
      order_id: orderId,
      amount: amountPaise,
      currency: "INR",
      name: "Jhatpat",
      description: `Order ${orderCode}`,
      prefill: { method },
      theme: { color: "#fed843" },
      handler: resolve,
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
    checkout.on("payment.failed", () => reject(new Error("Payment failed. Please try again.")));
    checkout.open();
  });
}
