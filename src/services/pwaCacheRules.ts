const BLOCKED_CACHE_PREFIXES = [
  '/dashboard',
  '/admin',
  '/employer',
  '/owner',
  '/school-dashboard',
  '/login',
  '/register',
  '/verify-otp',
  '/forgot-password',
  '/complete-profile',
];

const BLOCKED_SUBSTRINGS = [
  '/auth/v1/',
  '/rest/v1/',
  '/functions/v1/',
  '/storage/v1/object/authenticated',
  'private-documents',
  'razorpay',
  'payments',
  'invoices',
];

export function isSafeToCacheUrl(
  rawUrl: string,
  method = 'GET',
  appOrigin = 'https://shalomconnecthub.in'
): boolean {
  if (method.toUpperCase() !== 'GET') return false;
  let url: URL;
  try {
    url = new URL(rawUrl, appOrigin);
  } catch {
    return false;
  }
  if (url.origin !== appOrigin) return false;

  const path = url.pathname.toLowerCase();
  if (BLOCKED_CACHE_PREFIXES.some((p) => path.startsWith(p))) return false;
  if (BLOCKED_SUBSTRINGS.some((s) => url.href.toLowerCase().includes(s))) return false;

  return (
    path.startsWith('/assets/') ||
    path.startsWith('/icons/') ||
    path === '/manifest.webmanifest' ||
    path === '/offline.html'
  );
}
