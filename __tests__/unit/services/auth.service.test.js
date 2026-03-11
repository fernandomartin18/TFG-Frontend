import { describe, test, expect, beforeEach, vi } from 'vitest';
import authService from '../../../src/services/auth.service.js';

describe('Auth Service', () => {
  // Mock de localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => {
        store[key] = value.toString();
      },
      removeItem: (key) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      }
    };
  })();

  beforeEach(() => {
    // Resetear localStorage antes de cada test
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    localStorageMock.clear();
  });

  describe('Token Management', () => {
    test('setTokens guarda los tokens en localStorage', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      authService.setTokens(accessToken, refreshToken);

      expect(localStorage.getItem('accessToken')).toBe(accessToken);
      expect(localStorage.getItem('refreshToken')).toBe(refreshToken);
      expect(localStorage.getItem('isAuthenticated')).toBe('true');
    });

    test('getAccessToken retorna el token guardado', () => {
      const token = 'test-access-token';
      localStorage.setItem('accessToken', token);

      const result = authService.getAccessToken();

      expect(result).toBe(token);
    });

    test('getRefreshToken retorna el refresh token guardado', () => {
      const token = 'test-refresh-token';
      localStorage.setItem('refreshToken', token);

      const result = authService.getRefreshToken();

      expect(result).toBe(token);
    });

    test('getAccessToken retorna null si no hay token', () => {
      const result = authService.getAccessToken();

      expect(result).toBeNull();
    });
  });

  describe('User Data Management', () => {
    test('setUser guarda el usuario en localStorage', () => {
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      authService.setUser(user);

      const stored = localStorage.getItem('user');
      expect(stored).toBe(JSON.stringify(user));
    });

    test('getUser retorna el usuario guardado', () => {
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };
      localStorage.setItem('user', JSON.stringify(user));

      const result = authService.getUser();

      expect(result).toEqual(user);
    });

    test('getUser retorna null si no hay usuario', () => {
      const result = authService.getUser();

      expect(result).toBeNull();
    });

    test('getUser maneja JSON inválido', () => {
      localStorage.setItem('user', 'invalid-json');

      expect(() => authService.getUser()).toThrow();
    });
  });

  describe('Authentication Status', () => {
    test('isAuthenticated retorna true cuando hay token y flag de autenticación', () => {
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('isAuthenticated', 'true');

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    test('isAuthenticated retorna false si no hay token', () => {
      localStorage.setItem('isAuthenticated', 'true');

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    test('isAuthenticated retorna false si no hay flag de autenticación', () => {
      localStorage.setItem('accessToken', 'test-token');

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    test('isAuthenticated retorna false si el flag es diferente de "true"', () => {
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('isAuthenticated', 'false');

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('Clear Auth Data', () => {
    test('clearAuthData elimina todos los datos de autenticación', () => {
      // Preparar datos
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('refreshToken', 'test-refresh');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));
      localStorage.setItem('isAuthenticated', 'true');

      authService.clearAuthData();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('isAuthenticated')).toBeNull();
    });

    test('clearAuthData no lanza error si no hay datos', () => {
      expect(() => authService.clearAuthData()).not.toThrow();
    });
  });

  describe('Logout', () => {
    test('logout limpia los datos locales', async () => {
      // Mock fetch
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Logout successful' }),
        })
      );

      // Preparar datos
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('refreshToken', 'test-refresh');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));
      localStorage.setItem('isAuthenticated', 'true');

      await authService.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('isAuthenticated')).toBeNull();
    });

    test('logout limpia datos incluso si falla la petición al servidor', async () => {
      // Mock fetch que falla
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      // Preparar datos
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('refreshToken', 'test-refresh');

      await authService.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    test('logout funciona sin token', async () => {
      // No hay token
      expect(() => authService.logout()).not.toThrow();
    });
  });

  describe('Login', () => {
    test('login guarda tokens y usuario en localStorage cuando es exitoso', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        }
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      );

      const result = await authService.login('test@example.com', 'password123');

      expect(localStorage.getItem('accessToken')).toBe(mockResponse.accessToken);
      expect(localStorage.getItem('refreshToken')).toBe(mockResponse.refreshToken);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user));
      expect(localStorage.getItem('isAuthenticated')).toBe('true');
      expect(result).toEqual(mockResponse);
    });

    test('login lanza error cuando las credenciales son incorrectas', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Credenciales incorrectas' }),
        })
      );

      await expect(authService.login('test@example.com', 'wrong')).rejects.toThrow('Credenciales incorrectas');
    });

    test('login no guarda datos si no hay accessToken en la respuesta', async () => {
      const mockResponse = {
        message: 'Login successful but no token'
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      );

      await authService.login('test@example.com', 'password123');

      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });

  describe('Register', () => {
    test('register guarda tokens y usuario cuando es exitoso', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          id: 1,
          username: 'newuser',
          email: 'new@example.com'
        }
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      );

      const result = await authService.register('newuser', 'new@example.com', 'password123');

      expect(localStorage.getItem('accessToken')).toBe(mockResponse.accessToken);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user));
      expect(result).toEqual(mockResponse);
    });

    test('register lanza error cuando el usuario ya existe', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Usuario ya existe' }),
        })
      );

      await expect(
        authService.register('existinguser', 'test@example.com', 'password123')
      ).rejects.toThrow('Usuario ya existe');
    });
  });
});
