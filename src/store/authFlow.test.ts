import { describe, it, expect } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore (контракт)', () => {
  it('имеет bootstrap и logout', () => {
    const s = useAuthStore.getState();
    expect(typeof s.bootstrap).toBe('function');
    expect(typeof s.logout).toBe('function');
    expect(typeof s.refreshProfile).toBe('function');
    expect(typeof s.loginMockDemo).toBe('function');
  });
});
