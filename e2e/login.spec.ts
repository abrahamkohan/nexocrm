// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('loads login page successfully', async ({ page }) => {
    await expect(page).toHaveURL(/login/);
    // Check for the logo or submit button instead of heading
    await expect(page.getByRole('img', { name: /kohan/i })).toBeVisible();
  });

  test('shows email and password fields', async ({ page }) => {
    // Form inputs - use getByPlaceholder or locate by type
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('shows submit button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /ingresar/i })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.locator('input[type="email"]').fill('invalid@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: /ingresar/i }).click();
    
    // Wait for error message
    await expect(page.getByText(/email o contraseña incorrectos/i)).toBeVisible();
  });

  test('can navigate to password recovery', async ({ page }) => {
    await page.getByRole('button', { name: /olvidaste tu contraseña/i }).click();
    await expect(page.getByText(/te mandamos un link/i)).toBeVisible();
  });
});
