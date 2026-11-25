import { expect, test } from '@playwright/test';

test.describe('SHALOM CONNECTHUB INDIA — E2E & Mobile Responsiveness', () => {
  test('renders public search-first homepage, module directories, pricing, and PWA assets', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Everything Connected. Opportunities Everywhere.' })).toBeVisible();

    await page.goto('/jobs');
    await expect(page.getByRole('heading', { name: 'Job Vacancies Across India' })).toBeVisible();

    await page.goto('/properties');
    await expect(page.getByRole('heading', { name: /Property Connect/i })).toBeVisible();

    await page.goto('/schools');
    await expect(page.getByRole('heading', { name: /Schools, Colleges, Preschools/i })).toBeVisible();

    await page.goto('/pricing');
    await expect(page.getByText('₹499')).toBeVisible();

    const manifestRes = await request.get('/manifest.webmanifest');
    expect(manifestRes.status()).toBe(200);
    const offlineRes = await request.get('/offline.html');
    expect(offlineRes.status()).toBe(200);
    const swRes = await request.get('/sw.js');
    expect(swRes.status()).toBe(200);
  });

  test('is mobile responsive at 375x812 with no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const route of ['/', '/jobs', '/properties', '/schools', '/pricing', '/login']) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflow, `Horizontal overflow detected on ${route}`).toBe(false);
    }
  });

  test('enforces role permissions and allows Super Admin and Employer login flows', async ({ page }) => {
    // Login cleanly as Employer -> lands on /employer, then denied /admin
    await page.goto('/login');
    await page.getByRole('button', { name: 'Employer' }).click();
    await expect(page).toHaveURL(/\/employer/);

    await page.goto('/admin');
    await expect(page.getByText(/Access Restricted/i)).toBeVisible();

    // Sign out -> unauthenticated /admin redirects to /login
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);

    // Login as Super Admin -> /admin accessible
    await page.getByRole('button', { name: 'Super Admin' }).click();
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText('Platform Governance & Operations')).toBeVisible();
  });
});
