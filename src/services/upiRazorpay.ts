import QRCode from 'qrcode';

export interface UpiPaymentUriInput {
  upiVpa: string;
  payeeName: string;
  amountInr: number;
  transactionRef: string;
  note: string;
}

export function isValidUpiVpa(vpa: string): boolean {
  return /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z]{2,32}$/.test(vpa.trim());
}

export function isValidUtrReference(utr: string): boolean {
  return /^[A-Za-z0-9]{10,22}$/.test(utr.trim());
}

export function buildUpiPaymentUri(input: UpiPaymentUriInput): string {
  const vpa = input.upiVpa.trim();
  if (!isValidUpiVpa(vpa)) {
    throw new Error('Invalid UPI VPA address.');
  }
  const amount = Math.max(0, Math.round(input.amountInr * 100) / 100).toFixed(2);
  const params = new URLSearchParams({
    pa: vpa,
    pn: input.payeeName.trim() || 'SHALOM CONNECTHUB INDIA',
    am: amount,
    cu: 'INR',
    tr: input.transactionRef.slice(0, 35),
    tn: input.note.slice(0, 60),
  });
  return `upi://pay?${params.toString()}`;
}

export async function generateUpiQrDataUrl(upiUri: string): Promise<string> {
  return QRCode.toDataURL(upiUri, {
    width: 240,
    margin: 2,
    color: { dark: '#111948', light: '#ffffff' },
  });
}

export interface RazorpayCheckoutOptions {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency?: 'INR';
  name: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  onSuccess: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure?: (err: unknown) => void;
}

export async function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) return true;

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  const loaded = await loadRazorpayCheckoutScript();
  const RazorpayCtor = (window as unknown as { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (ev: string, cb: (r: unknown) => void) => void } }).Razorpay;
  if (!loaded || !RazorpayCtor) {
    throw new Error('Razorpay Checkout SDK could not be loaded. Use UPI QR or check network.');
  }

  const rzp = new RazorpayCtor({
    key: options.keyId,
    amount: options.amountPaise,
    currency: options.currency ?? 'INR',
    name: options.name,
    description: options.description,
    order_id: options.orderId,
    prefill: {
      name: options.customerName,
      email: options.customerEmail,
      contact: options.customerPhone ?? '',
    },
    theme: { color: '#1935b8' },
    handler: options.onSuccess,
  });

  if (options.onFailure) {
    rzp.on('payment.failed', options.onFailure);
  }
  rzp.open();
}
