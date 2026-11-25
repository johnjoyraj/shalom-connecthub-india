export const SUPPLIER_STATE_CODE = 'UP';
export const DEFAULT_GST_RATE_PCT = 18;

export interface GstBreakdown {
  taxType: 'INTRA_STATE' | 'INTER_STATE';
  taxableAmountInr: number;
  cgstInr: number;
  sgstInr: number;
  igstInr: number;
  totalTaxInr: number;
  totalAmountInr: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateIndianGst(
  taxableAmountInr: number,
  customerStateCode: string,
  gstRatePercent = DEFAULT_GST_RATE_PCT
): GstBreakdown {
  const taxable = round2(Math.max(0, taxableAmountInr));
  const totalTax = round2((taxable * gstRatePercent) / 100);
  const isIntraState = customerStateCode.trim().toUpperCase() === SUPPLIER_STATE_CODE;

  if (isIntraState) {
    const half = round2(totalTax / 2);
    const otherHalf = round2(totalTax - half);
    return {
      taxType: 'INTRA_STATE',
      taxableAmountInr: taxable,
      cgstInr: half,
      sgstInr: otherHalf,
      igstInr: 0,
      totalTaxInr: totalTax,
      totalAmountInr: round2(taxable + totalTax),
    };
  }

  return {
    taxType: 'INTER_STATE',
    taxableAmountInr: taxable,
    cgstInr: 0,
    sgstInr: 0,
    igstInr: totalTax,
    totalTaxInr: totalTax,
    totalAmountInr: round2(taxable + totalTax),
  };
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitsToWords(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`;
}

function integerToIndianWords(num: number): string {
  if (num === 0) return 'Zero';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const rest = num % 100;

  const parts: string[] = [];
  if (crore) parts.push(`${integerToIndianWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigitsToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigitsToWords(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigitsToWords(rest));
  return parts.join(' ').trim();
}

export function formatRupeesInWords(amountInr: number): string {
  const safe = round2(Math.max(0, amountInr));
  const rupees = Math.floor(safe);
  const paise = Math.round((safe - rupees) * 100);
  const rupeePart = `Rupees ${integerToIndianWords(rupees)}`;
  if (paise > 0) {
    return `${rupeePart} and ${twoDigitsToWords(paise)} Paise Only`;
  }
  return `${rupeePart} Only`;
}
