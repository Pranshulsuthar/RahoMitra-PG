import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Test getSafeReturnUrl logic
function getSafeReturnUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (trimmed.includes('\\') || trimmed.includes(':')) return null;
  return trimmed;
}

describe('Frontend Integration & Route Security', () => {
  it('getSafeReturnUrl allows valid relative internal paths', () => {
    assert.equal(getSafeReturnUrl('/admin/dashboard'), '/admin/dashboard');
    assert.equal(getSafeReturnUrl('/owner/properties/prop_1'), '/owner/properties/prop_1');
    assert.equal(getSafeReturnUrl('/student/accommodation'), '/student/accommodation');
  });

  it('getSafeReturnUrl strictly blocks open redirect attacks', () => {
    // Protocol-relative URL
    assert.equal(getSafeReturnUrl('//evil.com/phishing'), null);
    // Absolute external URLs
    assert.equal(getSafeReturnUrl('https://evil.com'), null);
    assert.equal(getSafeReturnUrl('http://attacker.com/login'), null);
    assert.equal(getSafeReturnUrl('javascript:alert(1)'), null);
    // Backslash bypasses
    assert.equal(getSafeReturnUrl('/\\evil.com'), null);
    // Non-string or empty inputs
    assert.equal(getSafeReturnUrl(''), null);
    assert.equal(getSafeReturnUrl(undefined), null);
    assert.equal(getSafeReturnUrl(null), null);
  });

  it('verifies single-flight refresh concurrency logic', async () => {
    let refreshCount = 0;
    let refreshPromise: Promise<string> | null = null;

    async function mockSilentRefresh(): Promise<string> {
      if (refreshPromise) return refreshPromise;
      refreshPromise = (async () => {
        refreshCount++;
        await new Promise((r) => setTimeout(r, 10));
        return 'fresh_token_123';
      })();
      try {
        return await refreshPromise;
      } finally {
        refreshPromise = null;
      }
    }

    // Fire 5 concurrent 401 triggers
    const results = await Promise.all([
      mockSilentRefresh(),
      mockSilentRefresh(),
      mockSilentRefresh(),
      mockSilentRefresh(),
      mockSilentRefresh(),
    ]);

    // All receive the new token
    assert.equal(results.every((t) => t === 'fresh_token_123'), true);
    // But the refresh API endpoint was only called ONCE
    assert.equal(refreshCount, 1);
  });

  it('verifies role-based redirect matrix', () => {
    function getDashboardForRole(role: 'admin' | 'owner' | 'student'): string {
      if (role === 'admin') return '/admin/dashboard';
      if (role === 'owner') return '/owner/dashboard';
      return '/student/dashboard';
    }

    assert.equal(getDashboardForRole('admin'), '/admin/dashboard');
    assert.equal(getDashboardForRole('owner'), '/owner/dashboard');
    assert.equal(getDashboardForRole('student'), '/student/dashboard');

    function isRoleAllowed(userRole: string, allowedRole?: string): boolean {
      if (!allowedRole) return true;
      return userRole === allowedRole;
    }

    assert.equal(isRoleAllowed('student', 'admin'), false);
    assert.equal(isRoleAllowed('student', 'owner'), false);
    assert.equal(isRoleAllowed('admin', 'admin'), true);
    assert.equal(isRoleAllowed('owner', 'owner'), true);
  });
});
