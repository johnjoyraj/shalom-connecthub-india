import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isSafeToCacheUrl } from '../services/pwaCacheRules';
import { computeScaledDimensions } from '../utils/imageCompression';

describe('Phase 8: PWA Safety, Offline Fallback & Performance', () => {
  it('provides a valid Web App Manifest, icons, offline fallback, and service worker', () => {
    const manifestPath = resolve(process.cwd(), 'public/manifest.webmanifest');
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    expect(manifest.name).toBe('SHALOM CONNECTHUB INDIA');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    expect(existsSync(resolve(process.cwd(), 'public/offline.html'))).toBe(true);
    expect(existsSync(resolve(process.cwd(), 'public/icons/icon-192.svg'))).toBe(true);
    expect(existsSync(resolve(process.cwd(), 'public/icons/icon-512.svg'))).toBe(true);

    const swSource = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8');
    expect(swSource).toContain('private-documents');
    expect(swSource).toContain('razorpay');
    expect(swSource).toContain('/offline.html');
  });

  it('never caches private documents, payment endpoints, auth tokens, or private dashboards', () => {
    const origin = 'https://shalomconnecthub.in';

    // Safe public static assets
    expect(isSafeToCacheUrl(`${origin}/assets/index-123.js`, 'GET', origin)).toBe(true);
    expect(isSafeToCacheUrl(`${origin}/icons/icon-192.svg`, 'GET', origin)).toBe(true);
    expect(isSafeToCacheUrl(`${origin}/manifest.webmanifest`, 'GET', origin)).toBe(true);
    expect(isSafeToCacheUrl(`${origin}/offline.html`, 'GET', origin)).toBe(true);

    // Unsafe / Private / Payments / Mutations
    expect(isSafeToCacheUrl(`${origin}/dashboard/payments`, 'GET', origin)).toBe(false);
    expect(isSafeToCacheUrl(`${origin}/admin/audit-logs`, 'GET', origin)).toBe(false);
    expect(isSafeToCacheUrl(`${origin}/employer/applications`, 'GET', origin)).toBe(false);
    expect(isSafeToCacheUrl(`${origin}/owner/documents`, 'GET', origin)).toBe(false);
    expect(isSafeToCacheUrl(`${origin}/school-dashboard/admissions`, 'GET', origin)).toBe(false);
    expect(isSafeToCacheUrl(`${origin}/storage/v1/object/authenticated/private-documents/cv.pdf`, 'GET', origin)).toBe(false);
    expect(isSafeToCacheUrl(`${origin}/functions/v1/razorpay-create-order`, 'GET', origin)).toBe(false);
    expect(isSafeToCacheUrl('https://api.razorpay.com/v1/orders', 'GET', origin)).toBe(false);
    expect(isSafeToCacheUrl(`${origin}/assets/index-123.js`, 'POST', origin)).toBe(false);
  });

  it('computes scaled dimensions preserving aspect ratio for image compression', () => {
    expect(computeScaledDimensions(2560, 1280, 1280, 1280)).toEqual({ width: 1280, height: 640 });
    expect(computeScaledDimensions(800, 600, 1280, 1280)).toEqual({ width: 800, height: 600 });
  });
});
